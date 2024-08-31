/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { marker } from "leaflet";
import { io } from "socket.io-client";
import Loader from "./Loader";


function MapRender() {
  const apiUrl = import.meta.env.VITE_DEPLOY_URL;


  const [location, setLocation] = useState([51.505, -0.09]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const socket = io(`${apiUrl}`);

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          socket.emit("location-send", { latitude, longitude });
          setLocation([latitude, longitude]);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setError(error);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    } else {
      setError(new Error("Geolocation is not supported by this browser."));
      setLoading(false);
    }

    socket.on("recieve", (data) => {
      const { id, latitude, longitude } = data;
      console.log(`Received location from ${id}: ${latitude}, ${longitude}`);

      setMarkers((prevMarkers) => {
        const updatedMarkers = prevMarkers.filter((marker) => marker.id !== id);
        const map = mapRef.current;

        if (map) {
          // Remove the old marker if it exists
          const existingMarker =
            map._layers[
              Object.keys(map._layers).find(
                (key) => map._layers[key].options.id === id
              )
            ];
          if (existingMarker) {
            map.removeLayer(existingMarker);
          }
        }

        // Add new marker
        const newMarker = L.marker([latitude, longitude], { id }).addTo(map);
        return [
          ...updatedMarkers,
          { id, lat: latitude, lng: longitude, marker: newMarker },
        ];
      });
      console.log(markers);
    });

    socket.on("user-disconnect", (id) => {
      setMarkers((prevMarkers) => {
        const map = mapRef.current;
        const updatedMarkers = prevMarkers.filter((markerData) => {
          if (markerData.id === id) {
            if (map) {
              const existingMarker =
                map._layers[
                  Object.keys(map._layers).find(
                    (key) => map._layers[key].options.id === id
                  )
                ];
              if (existingMarker) {
                map.removeLayer(existingMarker);
              }
            }
            return false;
          }
          return true;
        });
        return updatedMarkers;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-screen">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="text-red-500">
          Error: {error.message || "Failed to retrieve location"}
        </div>
      ) : (
        <MapContainer
          ref={mapRef}
          center={location}
          zoom={16}
          style={{ height: "100vh", width: "100vw" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; Heet Boda"
          />
          {markers.map((markerData) => (
            <Marker
              key={markerData.id}
              position={[markerData.lat, markerData.lng]}
            >
              <Popup>
                User ID: {markerData.id} <br /> Latitude: {markerData.lat},
                Longitude: {markerData.lng}.
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default MapRender;
