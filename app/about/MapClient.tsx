"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { SITE_CONFIG } from "@/lib/site-config";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Road #7, Sector #3, Uttara (from Google Maps place)
const position: [number, number] = [23.8644706, 90.3980684];

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
            <strong>{SITE_CONFIG.name}</strong>
            <br />
            5B, House #4, Road #7, Sector #3, Uttara
            <br />
            Dhaka, Bangladesh
            <br />
            <a
              href="https://maps.app.goo.gl/3kWfm4iG8a3ZdfLF6"
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
