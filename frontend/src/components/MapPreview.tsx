"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { approximateCenter } from "@/lib/geo";

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
  polygon = [],
  draw = false,
  onPolygon,
  accuracyM,
  approximate = false,
}: {
  lat: number;
  lng: number;
  draggable?: boolean;
  onMove?: (lat: number, lng: number) => void;
  polygon?: [number, number][];
  draw?: boolean;
  onPolygon?: (points: [number, number][]) => void;
  accuracyM?: number;
  approximate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const shapeRef = useRef<L.Layer | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onMoveRef = useRef(onMove);
  const onPolygonRef = useRef(onPolygon);
  const polygonRef = useRef(polygon);
  onMoveRef.current = onMove;
  onPolygonRef.current = onPolygon;
  polygonRef.current = polygon;

  useEffect(() => {
    if (!ref.current) return;
    const shown = approximate ? approximateCenter(lat, lng) : { lat, lng };
    const placeMarker = (map: L.Map) => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });
      if (approximate) return;
      const marker = L.marker([shown.lat, shown.lng], { icon, draggable }).addTo(map);
      if (draggable) {
        marker.on("dragend", () => {
          const point = marker.getLatLng();
          onMoveRef.current?.(point.lat, point.lng);
        });
      }
    };
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { zoomControl: false, attributionControl: true }).setView([shown.lat, shown.lng], approximate ? 14 : 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapRef.current);
      placeMarker(mapRef.current);
    } else {
      const center = mapRef.current.getCenter();
      if (Math.abs(center.lat - shown.lat) > 0.00002 || Math.abs(center.lng - shown.lng) > 0.00002) {
        mapRef.current.setView([shown.lat, shown.lng], mapRef.current.getZoom());
      }
      placeMarker(mapRef.current);
    }
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    if (accuracyM && accuracyM > 0) {
      circleRef.current = L.circle([shown.lat, shown.lng], {
        radius: accuracyM,
        color: "#4F5A3A",
        weight: 1,
        fillColor: "#4F5A3A",
        fillOpacity: 0.15,
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;
    if (shapeRef.current) {
      map.removeLayer(shapeRef.current);
      shapeRef.current = null;
    }
    if (polygon.length >= 2) {
      const style = { color: "#4F5A3A", weight: 2, fillOpacity: 0.18 };
      shapeRef.current = (polygon.length >= 3 ? L.polygon(polygon, style) : L.polyline(polygon, style)).addTo(map);
    }
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [lat, lng, polygon, accuracyM, approximate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !draw) return;
    const onClick = (event: L.LeafletMouseEvent) => {
      const next = [...(polygonRef.current || []), [event.latlng.lat, event.latlng.lng] as [number, number]];
      onPolygonRef.current?.(next.slice(0, 40));
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [draw, lat, lng]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={ref} className="w-full h-[180px]" style={{ borderRadius: 18, overflow: "hidden" }} />;
}
