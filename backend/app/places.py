import os

import httpx

DAR_LAT = -6.7924
DAR_LNG = 39.2083
GOOGLE_KEY = (os.getenv("GOOGLE_MAPS_API_KEY") or "").strip()
HEADERS = {"User-Agent": "Jengo/1.0 (nyumba marketplace)"}


def suggest(query: str) -> list[dict]:
    q = (query or "").strip()
    if len(q) < 2:
        return []
    if GOOGLE_KEY:
        rows = _google(q)
        if rows:
            return rows
    return _photon(q) or _nominatim(q)


def details(place_id: str) -> dict | None:
    pid = (place_id or "").strip()
    if not pid or not GOOGLE_KEY:
        return None
    try:
        res = httpx.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            params={
                "place_id": pid,
                "fields": "formatted_address,geometry,address_component,name",
                "language": "en",
                "key": GOOGLE_KEY,
            },
            timeout=8.0,
        )
        res.raise_for_status()
        result = (res.json() or {}).get("result") or {}
        loc = ((result.get("geometry") or {}).get("location")) or {}
        city = _google_city(result.get("address_components") or [])
        label = result.get("name") or result.get("formatted_address") or ""
        if not loc.get("lat"):
            return None
        return {
            "label": label,
            "city": city,
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "place_id": pid,
        }
    except Exception:
        return None


def _google(query: str) -> list[dict]:
    try:
        res = httpx.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params={
                "input": query,
                "components": "country:tz",
                "language": "en",
                "key": GOOGLE_KEY,
            },
            timeout=8.0,
        )
        res.raise_for_status()
        out = []
        for row in (res.json() or {}).get("predictions") or []:
            label = row.get("description") or row.get("structured_formatting", {}).get("main_text") or ""
            if not label:
                continue
            out.append(
                {
                    "label": label,
                    "city": "",
                    "lat": None,
                    "lng": None,
                    "place_id": row.get("place_id") or "",
                }
            )
        return out[:6]
    except Exception:
        return []


def _google_city(parts: list) -> str:
    city = ""
    for part in parts:
        types = part.get("types") or []
        name = part.get("long_name") or ""
        if "locality" in types:
            return name
        if "administrative_area_level_2" in types and not city:
            city = name
        if "administrative_area_level_1" in types and not city:
            city = name
    return city


def _photon(query: str) -> list[dict]:
    try:
        res = httpx.get(
            "https://photon.komoot.io/api/",
            params={"q": query, "lat": DAR_LAT, "lon": DAR_LNG, "limit": 6, "lang": "en"},
            headers=HEADERS,
            timeout=8.0,
        )
        res.raise_for_status()
        out = []
        for feat in (res.json() or {}).get("features") or []:
            props = feat.get("properties") or {}
            coords = (feat.get("geometry") or {}).get("coordinates") or []
            if len(coords) < 2:
                continue
            lng, lat = coords[0], coords[1]
            name = props.get("name") or props.get("street") or ""
            city = props.get("city") or props.get("county") or props.get("state") or ""
            bits = [name, city, props.get("country")]
            label = ", ".join(b for b in bits if b)
            if not label:
                continue
            out.append({"label": label, "city": city, "lat": lat, "lng": lng, "place_id": ""})
        return out[:6]
    except Exception:
        return []


def _nominatim(query: str) -> list[dict]:
    try:
        res = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": query,
                "format": "json",
                "addressdetails": 1,
                "limit": 6,
                "countrycodes": "tz",
            },
            headers=HEADERS,
            timeout=8.0,
        )
        res.raise_for_status()
        out = []
        for row in res.json() or []:
            addr = row.get("address") or {}
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state") or ""
            label = row.get("display_name") or ""
            if not label:
                continue
            out.append(
                {
                    "label": label,
                    "city": city,
                    "lat": float(row["lat"]),
                    "lng": float(row["lon"]),
                    "place_id": "",
                }
            )
        return out[:6]
    except Exception:
        return []
