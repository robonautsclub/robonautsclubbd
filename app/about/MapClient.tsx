"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const position: [number, number] = [23.8613196, 90.4021894];

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapClient() {
  return (
    <div className="h-[420px] w-full rounded-2xl overflow-hidden border shadow-sm">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={position} icon={defaultIcon}>
          <Popup>
            <strong>Robonauts Club</strong>
            <br />
            International Hope School Bangladesh
            <br />
            Uttara, Dhaka, Bangladesh
            <br />
            <a
              href="https://maps.app.goo.gl/BJXyvmBDBHTkagNH6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-block"
            >
              View on Google Maps
            </a>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
