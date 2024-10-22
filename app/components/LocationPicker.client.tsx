import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationChange: (lat: number | null, lng: number | null) => void;
}

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [pendingPosition, setPendingPosition] = useState<LatLng | null>(null);
  const [initialPosition, setInitialPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    // Try to get user's location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
        setInitialPosition(newPos);
      },
      () => {
        // Default to San Francisco if geolocation fails
        const defaultPos = new L.LatLng(37.7749, -122.4194);
        setInitialPosition(defaultPos);
      }
    );
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setPendingPosition(new L.LatLng(lat, lng));
  };

  const handleSetLocation = () => {
    if (pendingPosition) {
      setPosition(pendingPosition);
      onLocationChange(pendingPosition.lat, pendingPosition.lng);
    }
  };

  const handleClearLocation = () => {
    setPosition(null);
    setPendingPosition(null);
    onLocationChange(null, null);
  };

  if (!initialPosition) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={initialPosition}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <>
            <Marker position={position} />
            <MapCenter center={position} />
          </>
        )}
        {pendingPosition && !position && (
          <Marker 
            position={pendingPosition} 
            opacity={0.6}
          />
        )}
        <MapEvents onClick={handleMapClick} />
      </MapContainer>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSetLocation}
          disabled={!pendingPosition || !!position}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          Set Location
        </button>
        <button
          type="button"
          onClick={handleClearLocation}
          disabled={!position && !pendingPosition}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
        >
          Clear Location
        </button>
      </div>
    </div>
  );
}