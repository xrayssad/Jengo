"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPreview({
  lat,
  lng,
  draggable = false,
  onMove,
}: {
  lat: number;
  lng: number;
  draggable?: boolean;
  onMove?: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!ref.current) return;
    const placeMarker = (map: L.Map) => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });
      const marker = L.marker([lat, lng], { icon, draggable }).addTo(map);
      if (draggable) {
        marker.on("dragend", () => {
          const point = marker.getLatLng();
          onMoveRef.current?.(point.lat, point.lng);
        });
      }
    };
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapRef.current);
      placeMarker(mapRef.current);
    } else {
      const center = mapRef.current.getCenter();
      if (Math.abs(center.lat - lat) > 0.00002 || Math.abs(center.lng - lng) > 0.00002) {
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      }
      placeMarker(mapRef.current);
    }
    const map = mapRef.current;
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={ref} className="w-full h-[180px]" style={{ borderRadius: 18, overflow: "hidden" }} />;
}
