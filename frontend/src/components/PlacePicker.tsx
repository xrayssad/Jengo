"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { placeDetails, suggestPlaces, type PlaceHit } from "@/lib/api";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

export type PlaceValue = {
  location: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

export default function PlacePicker({ value, onChange }: { value: PlaceValue; onChange: (v: PlaceValue) => void }) {
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.location.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      suggestPlaces(q)
        .then((res) => {
          setHits(res.items || []);
          setOpen(true);
        })
        .catch(() => setHits([]));
    }, 280);
    return () => window.clearTimeout(t);
  }, [value.location]);

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  const pick = async (hit: PlaceHit) => {
    let next = hit;
    if ((!hit.lat || !hit.lng) && hit.place_id) {
      try {
        next = await placeDetails(hit.place_id);
      } catch {
        next = hit;
      }
    }
    onChange({
      location: next.label,
      city: next.city || "",
      lat: next.lat ?? null,
      lng: next.lng ?? null,
    });
    setHits([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={box}>
      <input
        value={value.location}
        onChange={(e) => onChange({ ...value, location: e.target.value, lat: null, lng: null })}
        onFocus={() => hits.length && setOpen(true)}
        placeholder="Andika mtaa au eneo"
        className="input-chocolate w-full px-4 py-3.5 text-sm"
        autoComplete="off"
      />
      {open && hits.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 overflow-hidden" style={{ backgroundColor: "#FFF6ED", border: "1px solid #8B5E3C" }}>
          {hits.map((h) => (
            <button
              key={`${h.label}-${h.place_id || h.lat}`}
              type="button"
              onClick={() => pick(h)}
              className="block w-full text-left px-4 py-2.5 text-sm"
              style={{ color: "#2E1A0F", borderBottom: "1px solid rgba(139,94,60,0.18)" }}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}
      {value.lat != null && value.lng != null && (
        <div className="mt-3 overflow-hidden" style={{ border: "1px solid #8B5E3C", borderRadius: 18 }}>
          <MapPreview lat={value.lat} lng={value.lng} />
        </div>
      )}
    </div>
  );
}
