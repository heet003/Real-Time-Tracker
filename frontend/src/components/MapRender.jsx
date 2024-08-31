/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";
import Loader from "./Loader";
import NameForm from "./NameForm"; // Import the NameForm component
import { Modal } from "antd";
import "antd/dist/reset.css";

const markerIcon2x = "./Images/marker-icon-2x.png";
const markerIcon = "./Images/marker-icon.png";
const markerShadow = "./Images/marker-shadow.png";

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRender() {
  const apiUrl = import.meta.env.VITE_DEPLOY_URL;

  const [location, setLocation] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const [userName, setUserName] = useState(null); // User name state
  const [showNameForm, setShowNameForm] = useState(true); // Show NameForm state
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
          setIsModalVisible(true); // Show modal on error
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    } else {
      const geoError = new Error(
        "Geolocation is not supported by this browser."
      );
      setError(geoError);
      setLoading(false);
      setIsModalVisible(true); // Show modal on error
    }

    socket.on("recieve", (data) => {
      const { id, latitude, longitude } = data;

      setMarkers((prevMarkers) => {
        const updatedMarkers = prevMarkers.filter((marker) => marker.id !== id);
        const map = mapRef.current;

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

        const newMarker = L.marker([latitude, longitude], {
          id,
          icon: customIcon,
        }).addTo(map);
        return [
          ...updatedMarkers,
          { id, lat: latitude, lng: longitude, marker: newMarker, name: "" },
        ];
      });
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

  const handleNameSubmit = (name) => {
    setUserName(name);
    setShowNameForm(false); // Hide the NameForm after submission
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="w-full h-screen relative">
      {loading ? (
        <Loader />
      ) : (
        <>
          {showNameForm && <NameForm onSubmit={handleNameSubmit} />}
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
                icon={markerData.marker.options.icon}
              >
                <Tooltip permanent direction="top" offset={[0, -20]}>
                  {userName
                    ? `User Name: ${userName}`
                    : `User ID: ${markerData.id}`}{" "}
                  <br />
                  Latitude: {markerData.lat}, Longitude: {markerData.lng}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          {/* Error Modal */}
          <Modal
            title="Error"
            visible={isModalVisible}
            onOk={handleOk}
            onCancel={handleOk}
            okText="OK"
            cancelButtonProps={{ style: { display: "none" } }}
          >
            <p>{error?.message || "Failed to retrieve location"}</p>
          </Modal>
        </>
      )}
    </div>
  );
}

export default MapRender;
