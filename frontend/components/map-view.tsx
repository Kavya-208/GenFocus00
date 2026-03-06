"use client";

import { useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon (Leaflet bug in Next.js)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewProps {
  onLocationSelect: (lat: number, lng: number) => void;
  changeMask?: string | null;
  selectedLocation?: { lat: number; lng: number } | null;
}

// Click handler component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({ onLocationSelect, changeMask, selectedLocation }: MapViewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        📍 Click anywhere on the map to select a location for analysis
      </p>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ width: "100%", height: "500px", borderRadius: "16px" }}
      >
        {/* Satellite imagery layer - free from ESRI */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* Street names layer on top */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution=""
        />

        {/* Click handler */}
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Marker at selected location */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>
              Selected Location<br />
              Lat: {selectedLocation.lat.toFixed(4)}<br />
              Lng: {selectedLocation.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Change mask overlay below map */}
      {selectedLocation && changeMask && (
        <div className="rounded-xl border border-red-500/30 p-3 bg-secondary/20">
          <p className="text-xs text-muted-foreground mb-2">
            Change mask for selected location:
          </p>
          <img
            src={changeMask}
            alt="Change Detection Mask"
            className="w-full rounded-lg"
            style={{ opacity: 0.9 }}
          />
        </div>
      )}

      {/* Coordinates display */}
      {selectedLocation && (
        <div className="flex gap-6 text-xs text-muted-foreground px-1">
          <span>📍 Latitude: {selectedLocation.lat.toFixed(6)}</span>
          <span>📍 Longitude: {selectedLocation.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}