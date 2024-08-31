/* eslint-disable*/
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";
import Loader from "./Loader";
import NameForm from "./NameForm"; 
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
  const socket = io(`${apiUrl}`);

  const [location, setLocation] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [userName, setUserName] = useState(null); 
  const [showNameForm, setShowNameForm] = useState(true); 
  const mapRef = useRef(null);


  useEffect(() => {
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
          setIsModalVisible(true);
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
      setIsModalVisible(true);
    }

    socket.on("recieve", (data) => {
      const { id, userName, latitude, longitude } = data;

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
          {
            id,
            lat: latitude,
            lng: longitude,
            marker: newMarker,
            name: userName,
          },
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

    socket.on("update-name", ({ id, name }) => {
      setMarkers((prevMarkers) => {
        return prevMarkers.map((markerData) =>
          markerData.id === id ? { ...markerData, name } : markerData
        );
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNameSubmit = (name) => {
    setUserName(name);
    setShowNameForm(false);

    socket.emit("update-name", { name });
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
                icon={markerData.marker.options.icon || "ALT"}
              >
                <Tooltip permanent direction="top" offset={[0, -20]}>
                  {markerData.name
                    ? `User Name: ${markerData.name}`
                    : `User ID: ${markerData.id}`}
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
