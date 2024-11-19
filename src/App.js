import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";


import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
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

  const handlePhotoChange = (e) => {
    // Handle the uploaded photo
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (description) {
      setSpots([
        ...spots,
        { lat: newSpot.lat, lng: newSpot.lng, description, photo },
      ]);
      setNewSpot(null);
      setDescription("");
      setPhoto(null);
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
              {spot.photo && <img src={spot.photo} alt="Spot" style={{ width: "100px", height: "100px", marginBottom: "10px" }} />}
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
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photo && (
              <div style={{ marginTop: "10px" }}>
                <img src={photo} alt="Uploaded" style={{ width: "100px", height: "100px" }} />
              </div>
            )}
          </div>

          {/* Description Textarea */}
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
            <button onClick={handleSubmit}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;