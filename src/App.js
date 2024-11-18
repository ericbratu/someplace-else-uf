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

const App = () => {
  const [spots, setSpots] = useState([]);


  const AddMarker = () => {
    useMapEvents({
      click: (e) => {
        const description = prompt("Describe your spot:");
        if (description) {
          setSpots([
            ...spots,
            { lat: e.latlng.lat, lng: e.latlng.lng, description },
          ]);
        }
      },
    });
    return null;
  };

  return (
    <div className="App">
      <h1>Campus Chill Spots</h1>
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
            <Popup>{spot.description}</Popup>
          </Marker>
        ))}
        <AddMarker />
      </MapContainer>
    </div>
  );
};

export default App;
