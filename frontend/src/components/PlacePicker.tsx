"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { placeDetails, suggestPlaces, type PlaceHit } from "@/lib/api";
import {
  bannedLocation,
  coordLabel,
  debugGeoEnabled,
  getPreciseLocation,
  inTanzania,
  KNOWN_POINTS,
  needsLandmark,
  reverseGeocode,
  roundCoord,
  type LocationSource,
  type PreciseFix,
} from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { locationPermitSeen, markLocationPermit } from "@/lib/permit";
import BottomSheet from "./BottomSheet";
import GeoDebug from "./GeoDebug";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

export type PlaceValue = {
  location: string;
  city: string;
  lat: number | null;
  lng: number | null;
  accuracy_m?: number | null;
  location_source?: LocationSource;
  landmark?: string;
  region?: string;
  district?: string;
  ward?: string;
  confirmed?: boolean;
};

export default function PlacePicker({
  value,
  onChange,
  pin = false,
}: {
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  pin?: boolean;
}) {
  const { t, lang } = useI18n();
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [permit, setPermit] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(value.accuracy_m ?? null);
  const [locateError, setLocateError] = useState("");
  const [warn, setWarn] = useState("");
  const [naming, setNaming] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const gen = useRef(0);
  const pinTimer = useRef(0);
  valueRef.current = value;

  const apply = (next: PlaceValue) => {
    valueRef.current = next;
    onChange(next);
  };

  const namePlace = async (lat: number, lng: number, source: LocationSource) => {
    const ticket = ++gen.current;
    const current = valueRef.current;
    if (!(current.location_source === "manual" && source !== "pin" && source !== "gps")) {
      setNaming(true);
      apply({ ...current, lat, lng, location_source: source, confirmed: false, location: t("geo.naming") });
    }
    try {
      const described = await reverseGeocode(lat, lng, lang === "sw" ? "sw" : "en");
      if (ticket !== gen.current) return;
      const latest = valueRef.current;
      if (latest.location_source === "manual" && source !== "pin" && source !== "gps") return;
      const label = described.label && !bannedLocation(described.label) ? described.label : coordLabel(lat, lng, lang === "sw" ? "sw" : "en");
      apply({
        ...latest,
        location: label,
        city: described.city || latest.city,
        region: described.region || "",
        district: described.district || "",
        ward: described.ward || "",
        lat,
        lng,
        location_source: source,
        confirmed: false,
      });
    } catch {
      if (ticket !== gen.current) return;
      const latest = valueRef.current;
      apply({
        ...latest,
        location: coordLabel(lat, lng, lang === "sw" ? "sw" : "en"),
        lat,
        lng,
        location_source: source,
        confirmed: false,
      });
    } finally {
      if (ticket === gen.current) setNaming(false);
    }
  };

  const readPosition = () => {
    if (!navigator.geolocation) {
      setLocateError(t("geo.unavailable"));
      return;
    }
    if (!window.isSecureContext) {
      setLocateError(t("geo.https"));
      return;
    }
    setLocating(true);
    setLocateError("");
    setWarn("");
    setAccuracy(null);
    getPreciseLocation({
      onFix: (fix: PreciseFix) => {
        setAccuracy(fix.accuracy);
        apply({
          ...valueRef.current,
          lat: fix.lat,
          lng: fix.lng,
          accuracy_m: fix.accuracy,
          location_source: "gps",
          confirmed: false,
        });
      },
    })
      .then(async (fix) => {
        setAccuracy(fix.accuracy);
        if (!inTanzania(fix.lat, fix.lng)) setWarn(t("geo.outside"));
        else if (fix.accuracy > 1000) setWarn(t("geo.coarse"));
        else if (fix.accuracy > 100) setWarn(t("geo.poor"));
        await namePlace(fix.lat, fix.lng, "gps");
      })
      .catch((err: { code?: number }) => {
        if (err.code === 1) setLocateError(t("geo.denied"));
        else if (err.code === 3) setLocateError(t("geo.timeout"));
        else if (err.code === 0) setLocateError(t("geo.https"));
        else setLocateError(t("geo.unavailable"));
      })
      .finally(() => setLocating(false));
  };

  const search = () => {
    const q = valueRef.current.location.trim();
    if (q.length < 2 || naming) return;
    suggestPlaces(q)
      .then((res) => {
        setHits(res.items || []);
        setOpen(true);
      })
      .catch(() => setHits([]));
  };

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  useEffect(() => () => window.clearTimeout(pinTimer.current), []);

  const pick = async (hit: PlaceHit) => {
    let next = hit;
    if ((!hit.lat || !hit.lng) && hit.place_id) {
      try {
        next = await placeDetails(hit.place_id);
      } catch {
        next = hit;
      }
    }
    const lat = next.lat == null ? null : roundCoord(next.lat);
    const lng = next.lng == null ? null : roundCoord(next.lng);
    apply({
      ...valueRef.current,
      location: bannedLocation(next.label) ? "" : next.label,
      city: next.city || "",
      lat,
      lng,
      location_source: "search",
      confirmed: false,
      accuracy_m: null,
    });
    setAccuracy(null);
    setHits([]);
    setOpen(false);
    if (lat != null && lng != null && !inTanzania(lat, lng)) setWarn(t("geo.outside"));
  };

  const movePin = (lat: number, lng: number) => {
    const nextLat = roundCoord(lat);
    const nextLng = roundCoord(lng);
    setWarn(inTanzania(nextLat, nextLng) ? "" : t("geo.outside"));
    apply({
      ...valueRef.current,
      lat: nextLat,
      lng: nextLng,
      location_source: "pin",
      confirmed: false,
      accuracy_m: null,
    });
    setAccuracy(null);
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => {
      void namePlace(nextLat, nextLng, "pin");
    }, 600);
  };

  const pinned = value.lat != null && value.lng != null;
  const showMap = pin || pinned;
  const mapLat = pinned ? value.lat! : KNOWN_POINTS["Dar es Salaam"].lat;
  const mapLng = pinned ? value.lng! : KNOWN_POINTS["Dar es Salaam"].lng;
  const fallback = needsLandmark(value.location);

  return (
    <div className="relative" ref={box}>
      <div className="flex gap-2">
        <input
          value={naming ? t("geo.naming") : value.location}
          onChange={(e) => {
            setNaming(false);
            gen.current += 1;
            apply({
              ...value,
              location: e.target.value,
              location_source: "manual",
              confirmed: false,
            });
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            search();
          }}
          placeholder={t("geo.searchPlace")}
          className="input-chocolate w-full px-4 py-3.5 text-sm"
          autoComplete="off"
        />
        <button type="button" className="btn-secondary" onClick={search}>{t("geo.find")}</button>
      </div>
      {open && hits.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 overflow-hidden" style={{ backgroundColor: "var(--paper)", border: "1px solid var(--mocha)" }}>
          {hits.map((h) => (
            <button
              key={`${h.label}-${h.place_id || h.lat}`}
              type="button"
              onClick={() => pick(h)}
              className="block w-full text-left px-4 py-2.5 text-sm"
              style={{ color: "var(--ink)", borderBottom: "1px solid rgba(var(--mocha-rgb),0.18)" }}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}
      {pin ? (
        <div className="mt-3">
          <button
            type="button"
            className="wizard-locate"
            onClick={() => {
              if (!navigator.geolocation) {
                setLocateError(t("geo.unavailable"));
                return;
              }
              if (!locationPermitSeen()) {
                setPermit(true);
                return;
              }
              readPosition();
            }}
          >
            {locating ? `${t("geo.searching")}${accuracy != null ? ` ±${Math.round(accuracy)} m` : ""}` : t("wizard.locate")}
          </button>
          {locateError ? <p className="wizard-error">{locateError}</p> : null}
          {warn ? <p className="wizard-error">{warn}</p> : null}
          {(warn === t("geo.poor") || warn === t("geo.coarse")) ? <p className="wizard-tip">{t("geo.poorSteps")}</p> : null}
        </div>
      ) : null}
      {showMap ? (
        <div className="mt-3 overflow-hidden" style={{ borderRadius: 18 }}>
          <MapPreview
            lat={mapLat}
            lng={mapLng}
            draggable
            accuracyM={pinned ? (accuracy ?? value.accuracy_m ?? undefined) : undefined}
            onMove={movePin}
          />
          {pinned ? (
            <button
              type="button"
              className="btn-primary sheet-submit"
              style={{ marginTop: 8 }}
              onClick={() => apply({ ...valueRef.current, confirmed: true })}
            >
              {value.confirmed ? t("geo.confirmed") : t("geo.confirm")}
            </button>
          ) : (
            <p className="wizard-tip">{t("geo.dragHint")}</p>
          )}
        </div>
      ) : null}
      {fallback ? (
        <label className="wizard-field" style={{ marginTop: 12 }}>
          <span className="wizard-label">{t("geo.landmark")}</span>
          <input
            className="wizard-input"
            value={value.landmark || ""}
            maxLength={160}
            placeholder={t("geo.landmarkHint")}
            onChange={(event) => apply({ ...valueRef.current, landmark: event.target.value, location_source: value.location_source || "manual" })}
          />
        </label>
      ) : null}
      {debugGeoEnabled() ? <GeoDebug /> : null}
      <BottomSheet
        open={permit}
        title={t("permit.location.title")}
        onClose={() => {
          markLocationPermit();
          setPermit(false);
        }}
      >
        <p className="sheet-copy">{t("permit.location.body")}</p>
        <button
          type="button"
          className="btn-primary sheet-submit"
          onClick={() => {
            markLocationPermit();
            setPermit(false);
            readPosition();
          }}
        >
          {t("permit.allow")}
        </button>
      </BottomSheet>
    </div>
  );
}
