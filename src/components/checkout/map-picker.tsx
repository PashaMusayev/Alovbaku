"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
  label: string;
}

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:34px;height:34px;transform:translate(-50%,-100%);font-size:34px;line-height:34px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))">📍</div>',
  iconSize: [0, 0],
});

/** OpenStreetMap map with a draggable pin (free, no API key). Loaded only when opened. */
export default function MapPicker({ center, value, onChange, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start = value ?? center;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 17 : 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const marker = L.marker([start.lat, start.lng], { draggable: true, icon: pinIcon, keyboard: true }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChangeRef.current({ lat: p.lat, lng: p.lng });
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once
  }, []);

  // External changes (e.g. "use my location") move the pin.
  useEffect(() => {
    if (value && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.setView([value.lat, value.lng], 17);
    }
  }, [value]);

  return <div ref={containerRef} role="application" aria-label={label} className="h-64 w-full overflow-hidden rounded-2xl ring-1 ring-coal-600" />;
}
