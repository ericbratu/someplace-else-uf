import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import axios from "axios";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";



import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;

// API CALLING
const API_URL = process.env.REACT_APP_API_URL;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const gainesvilleBounds = [
  [29.5827, -82.6527],
  [29.7075, -82.2812],
];

const bounds = L.latLngBounds(gainesvilleBounds);

const App = () => {
  const [spots, setSpots] = useState([]);
  const [newSpot, setNewSpot] = useState(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Tracks the upload status (e.g., "Uploading..." or "Uploaded")

  useEffect(() => {
    const fetchPinpoints = async () => {
      try {
        const response = await axios.get(`${API_URL}/getPinpoints`);
        setSpots(response.data.items); // populate
      } catch (error) {
        console.error("Error fetching pinpoints:", error);
      }
    };

    fetchPinpoints();
  }, []);

  const AddMarker = () => {
    useMapEvents({
      click: (e) => {
        const latLng = e.latlng;
        if (bounds.contains(latLng)) {
          setNewSpot({
            lat: latLng.lat,
            lng: latLng.lng,
            position: {
              top: e.originalEvent.clientY - 100,
              left: e.originalEvent.clientX,
            },
          });
        } else {
          alert("You can only place a pinpoint within Gainesville city boundaries.");
        }
      },
    });
    return null;
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadStatus("Uploading..."); // Start the upload process
      try {
        let processedFile = file;

        // Convert HEIC to JPEG if needed
        if (file.type === "image/heic" || file.name.endsWith(".HEIC")) {
          const blob = await heic2any({ blob: file, toType: "image/jpeg" });
          processedFile = new File([blob], file.name.replace(".HEIC", ".jpg"), { type: "image/jpeg" });
        }

        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 3000,
          useWebWorker: true,
        };
        let compressedFile = await imageCompression(processedFile, options);

        while (compressedFile.size > 3 * 1024 * 1024) {
          options.maxSizeMB /= 2;
          compressedFile = await imageCompression(compressedFile, options);
        }

        const fileName = `${Date.now()}_${compressedFile.name}`;
        const response = await axios.get(`${API_URL}/uploadURL`, {
          params: {
            name: fileName,
            type: compressedFile.type,
          },
        });

        const { uploadURL, key } = response.data;

        // Upload the file to S3 using the pre-signed URL
        await axios.put(uploadURL, compressedFile, {
          headers: {
            "Content-Type": compressedFile.type,
          },
        });

        setPhoto(key); // Store the image key for saving later
        setUploadStatus("Uploaded"); // Upload complete
      } catch (error) {
        console.error("Error processing image:", error);
        setUploadStatus("Failed to upload. Try again."); // Upload failed
      }
    }
  };

  const handleSubmit = async () => {
    if (description && newSpot) {
      const payload = {
        lat: newSpot.lat,
        lng: newSpot.lng,
        description,
        photoKey: photo || null, 
      };
  
      try {
        const response = await axios.post(`${API_URL}/savePinpoint`, payload);
        setSpots([...spots, response.data.item]);
        setNewSpot(null);
        setDescription("");
        setPhoto(null);
        setUploadStatus("");
      } catch (error) {
        console.error("Error saving pinpoint:", error);
      }
    }
  };
  

  return (
    <div className="App">
      <h1>Someplace Else</h1>
      <MapContainer
        center={[29.648668324475622, -82.34678527211761]} // Centered on UF
        zoom={17}
        style={{ height: "80vh", width: "98%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot, idx) => (
          <Marker key={idx} position={[spot.lat, spot.lng]}>
            <Popup>
              {spot.photoUrl && spot.photoUrl.startsWith("http") && (
                <img
                  src={spot.photoUrl}
                  alt=""
                  style={{ width: "100%", height: "auto", marginBottom: "10px" }}
                />
              )}
              <p>{spot.description}</p>
            </Popup>
          </Marker>
        ))}

        <AddMarker />
      </MapContainer>

      {newSpot && (
  <div
    style={{
      position: "absolute",
      top: `${newSpot.position.top - 70}px`,
      left: `${newSpot.position.left - 105}px`,
      backgroundColor: "white",
      padding: "10px",
      border: "1px solid black",
      borderRadius: "5px",
      zIndex: 1000,
      width: "190px",
    }}
  >
    {/* Photo Upload */}
    <div style={{ marginBottom: "10px" }}>
      <input type="file" accept="image/*,.heic" onChange={handlePhotoChange} />
      {uploadStatus && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "0.9rem",
            color: uploadStatus === "Uploaded" ? "green" : "black",
          }}
        >
          {uploadStatus}
        </p>
      )}
    </div>

    {/* Description */}
    <textarea
      value={description}
      onChange={handleDescriptionChange}
      placeholder="Describe your spot..."
      rows="4"
      cols="20"
      style={{ marginBottom: "10px" }}
    />
    <div>
      <button onClick={() => setNewSpot(null)}>Cancel</button>

      {description.trim() && (
        <button
          onClick={handleSubmit}
          disabled={uploadStatus === "Uploading..."} // Disable while image is uploading
        >
          Save
        </button>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default App;

