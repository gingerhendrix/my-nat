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
  onLocationChange: (lat: number, lng: number) => void;
}

function MapEvents({ onLocationChange }: LocationPickerProps) {
  const map = useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
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
  const [initialPosition, setInitialPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    // Try to get user's location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
        setPosition(newPos);
        setInitialPosition(newPos);
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Default to San Francisco if geolocation fails
        const defaultPos = new L.LatLng(37.7749, -122.4194);
        setPosition(defaultPos);
        setInitialPosition(defaultPos);
        onLocationChange(37.7749, -122.4194);
      }
    );
  }, [onLocationChange]);

  if (!initialPosition) {
    return <div>Loading map...</div>;
  }

  return (
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
      <MapEvents onLocationChange={(lat, lng) => {
        setPosition(new L.LatLng(lat, lng));
        onLocationChange(lat, lng);
      }} />
    </MapContainer>
  );
}