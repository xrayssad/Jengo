"""Server-side totals. Client formulas in frontend/src/lib/pricing.ts must match."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

ROLES = {"owner", "agent", "caretaker", "business", "developer"}
STALE_DAYS = 30
CONFIRM_DAYS = 14
VAT = 1.18


def money(value) -> int:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0
    if n != n or n <= 0 or n > 1e12:
        return 0
    return int(round(n))


def _count(value, fallback: int, low: int, high: int) -> int:
    try:
        n = int(round(float(value)))
    except (TypeError, ValueError):
        return fallback
    return min(high, max(low, n))


def _text(value, limit: int) -> str:
    return str(value or "").strip()[:limit]


PLOT_UNITS = {"m2": 1.0, "acre": 4046.8564224, "ha": 10000.0}
LAND_USE = {"residential", "commercial", "agricultural", "industrial", "mixed"}
TENURE = {"gro", "ccro", "residential_licence", "village", "other"}
LAND_CAT = {"general", "village", "reserved"}
PLOT_DOCS = {
    "title",
    "survey_plan",
    "official_search",
    "land_rent",
    "sale_agreements",
    "seller_id",
    "family_consent",
    "mtaa_letter",
}
PROPERTY_TYPES = {"single", "master", "self", "house", "apartment"}
HOME_CATEGORIES = {"rooms-houses", "chumba_nyumba"}
SALE_TENURE = {"gro", "cro", "licence", "other"}
SALE_DOCS = {"title", "survey", "search", "receipts", "seller_id"}
SALE_PAY = {"full", "installments", "booking"}


def _float(value, low: float, high: float):
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if n != n or n < low or n > high:
        return None
    return round(n, 4)


def _choice(value, allowed: set[str]) -> str:
    text = str(value or "").strip()
    return text if text in allowed else ""


def _clean_plot(src: dict, price) -> dict:
    out: dict = {}
    kind = _choice(src.get("listing_type"), {"sale", "lease"}) or "sale"
    out["listing_type"] = kind
    unit = _choice(src.get("plot_unit"), set(PLOT_UNITS)) or "m2"
    size = _float(src.get("plot_size"), 0.0001, 1_000_000)
    if size:
        out["plot_unit"] = unit
        out["plot_size"] = size
        area = size * PLOT_UNITS[unit]
        out["size_m2"] = int(round(area)) if area >= 1 else round(area, 2)
        amount = money(price) or money(src.get("price"))
        if amount and area > 0:
            out["price_per_m2"] = int(round(amount / area))
            if unit in {"acre", "ha"}:
                acres = area / PLOT_UNITS["acre"]
                if acres > 0:
                    out["price_per_acre"] = int(round(amount / acres))
    if "price_per_m2" not in out:
        rate = money(src.get("price_per_m2"))
        if rate:
            out["price_per_m2"] = rate
    if "price_per_acre" not in out:
        rate = money(src.get("price_per_acre"))
        if rate:
            out["price_per_acre"] = rate
    for key, low, high in (("plot_width", 0.01, 100000), ("plot_length", 0.01, 100000)):
        span = _float(src.get(key), low, high)
        if span:
            out[key] = span
    payment = _choice(src.get("payment"), {"full", "installments", "deposit"})
    if payment:
        out["payment"] = payment
    note = _text(src.get("payment_note"), 160)
    if note:
        out["payment_note"] = note
    deposit = money(src.get("booking_deposit"))
    if deposit:
        out["booking_deposit"] = deposit
    for key, allowed in (
        ("land_use", LAND_USE),
        ("tenure", TENURE),
        ("land_category", LAND_CAT),
        ("road", {"tarmac", "murram", "footpath"}),
        ("water_nearby", {"mains", "borehole", "none"}),
        ("terrain", {"flat", "slope"}),
        ("flood", {"none", "some", "unknown"}),
        ("structures", {"none", "foundation", "building", "trees"}),
    ):
        picked = _choice(src.get(key), allowed)
        if picked:
            out[key] = picked
    for key, limit in (("road_distance", 40), ("town_distance", 40), ("plot_number", 40), ("block_number", 40)):
        text = _text(src.get(key), limit)
        if text:
            out[key] = text
    video = _text(src.get("video_url"), 400)
    if video.startswith("http://") or video.startswith("https://"):
        out["video_url"] = video
    docs = src.get("documents")
    if isinstance(docs, list):
        clean = []
        for name in docs:
            text = _text(name, 40)
            if text in PLOT_DOCS and text not in clean:
                clean.append(text)
        if clean:
            out["documents"] = clean
    points = src.get("boundary")
    if isinstance(points, list):
        ring = []
        for pair in points[:40]:
            if not isinstance(pair, (list, tuple)) or len(pair) < 2:
                continue
            lat = _float(pair[0], -90, 90)
            lng = _float(pair[1], -180, 180)
            if lat is None or lng is None:
                continue
            ring.append([lat, lng])
        if len(ring) >= 3:
            out["boundary"] = ring
    for key in ("surveyed", "electricity_nearby", "fenced"):
        if key in src:
            out[key] = bool(src.get(key))
    return out


def clean_fit(category: str, raw: dict | None, *, require_agent_fee: bool = True, price=None) -> dict:
    src = raw if isinstance(raw, dict) else {}
    role = src.get("poster_role") if src.get("poster_role") in ROLES else "owner"
    out: dict = {
        "poster_role": role,
        "free_viewing": bool(src.get("free_viewing", True)),
        "direct_owner": bool(src.get("direct_owner", role == "owner")),
        "costs_confirmed": bool(src.get("costs_confirmed")),
        "months_advance": _count(src.get("months_advance"), 1, 1, 24),
        "deposit": money(src.get("deposit")),
        "agent_fee": money(src.get("agent_fee")),
        "other_fee": money(src.get("other_fee")),
        "cleaning_fee": money(src.get("cleaning_fee")),
        "extra_guest_fee": money(src.get("extra_guest_fee")),
        "goodwill": money(src.get("goodwill")),
        "negotiable": bool(src.get("negotiable")),
        "instant_book": bool(src.get("instant_book")),
    }
    selling_home = category in HOME_CATEGORIES and str(src.get("listing_type") or "") == "sale"
    if role == "agent" and category != "plots" and not selling_home and require_agent_fee and out["agent_fee"] <= 0:
        raise ValueError("agent_fee")
    if role == "owner":
        out["direct_owner"] = True
    for key, limit in (
        ("room_type", 40),
        ("water", 40),
        ("electricity", 40),
        ("landmark", 160),
        ("directions", 400),
        ("whatsapp", 20),
        ("subtype", 20),
        ("truck", 20),
        ("cancellation", 20),
        ("power_backup", 40),
        ("available_from", 20),
        ("currency", 8),
        ("vat", 12),
        ("floor", 40),
        ("suitable", 80),
        ("condition", 20),
        ("allowed_goods", 160),
        ("delivery_note", 160),
        ("ceiling", 40),
        ("license_note", 160),
        ("reply_within", 12),
    ):
        text = _text(src.get(key), limit)
        if text:
            out[key] = text
    if out.get("cancellation") not in {None, "flexible", "moderate", "strict"}:
        out.pop("cancellation", None)
    if out.get("vat") not in {None, "included", "excluded"}:
        out.pop("vat", None)
    if out.get("currency") not in {None, "TZS", "USD"}:
        out.pop("currency", None)
    for key, low, high in (
        ("bedrooms", 0, 30),
        ("bathrooms", 0, 30),
        ("beds", 0, 40),
        ("guests", 1, 30),
        ("included_guests", 1, 30),
        ("min_nights", 1, 90),
        ("max_nights", 1, 90),
        ("nights", 1, 90),
    ):
        if src.get(key) is not None and src.get(key) != "":
            out[key] = _count(src.get(key), low, low, high)
    for key in ("size_m2", "price_per_sqm", "delivery_fee", "min_order"):
        amount = money(src.get(key))
        if amount:
            out[key] = amount
    amenities = src.get("amenities")
    if isinstance(amenities, list):
        clean = []
        for name in amenities:
            text = _text(name, 40)
            if text and text not in clean:
                clean.append(text)
            if len(clean) >= 24:
                break
        if clean:
            out["amenities"] = clean
    ptype = _text(src.get("property_type") or src.get("room_type"), 40)
    alias = {"self-contained": "self", "whole": "house", "whole_house": "house", "single_room": "single"}
    ptype = alias.get(ptype, ptype)
    if ptype in PROPERTY_TYPES:
        out["property_type"] = ptype
        out["room_type"] = ptype
    if category in HOME_CATEGORIES:
        kind = _choice(src.get("listing_type"), {"rent", "sale"}) or "rent"
        out["listing_type"] = kind
        if kind == "sale":
            tenure = _choice(src.get("tenure"), SALE_TENURE)
            if tenure:
                out["tenure"] = tenure
            docs = src.get("documents")
            if isinstance(docs, list):
                clean_docs = []
                for name in docs:
                    text = str(name or "").strip()
                    if text in SALE_DOCS and text not in clean_docs:
                        clean_docs.append(text)
                if clean_docs:
                    out["documents"] = clean_docs
            land = money(src.get("land_m2"))
            if land:
                out["land_m2"] = land
            built = money(src.get("built_m2"))
            if built:
                out["built_m2"] = built
            pay = _choice(src.get("payment"), SALE_PAY)
            if pay:
                out["payment"] = pay
            cond = _choice(src.get("condition"), {"new", "used"})
            if cond:
                out["condition"] = cond
        rules = _text(src.get("house_rules"), 400)
        if rules:
            out["house_rules"] = rules
    elif category == "plots" or src.get("plot_size") or src.get("listing_type") in {"sale", "lease"}:
        out.update(_clean_plot(src, price))
    return out


def public_fit(category: str, raw: dict | None) -> dict:
    """Validated fit for the API. Empty when the listing never stored these fields."""
    src = raw if isinstance(raw, dict) else {}
    if not src:
        if category in HOME_CATEGORIES:
            return {"listing_type": "rent"}
        return {}
    fit = clean_fit(category, src, require_agent_fee=False, price=src.get("price"))
    kept = {}
    computed = {"price_per_m2", "price_per_acre", "size_m2", "property_type", "room_type", "listing_type"}
    for key, value in fit.items():
        if key in src or key in computed:
            kept[key] = value
    if src.get("poster_role") == "owner":
        kept["direct_owner"] = True
    if src.get("documents_checked") is True:
        kept["documents_checked"] = True
    return kept


def quote_stay(category: str, price, fit: dict | None, stay: dict | None = None) -> dict:
    src = fit or {}
    stay = stay or {}
    amount = money(price)
    deposit = money(src.get("deposit"))
    lines: list[dict] = []

    def push(key: str, value: int):
        if value > 0:
            lines.append({"key": key, "amount": value})

    if category == "apartment_airbnb":
        nights = _count(stay.get("nights", src.get("nights")), 1, 1, 90)
        guests = _count(stay.get("guests", src.get("guests")), src.get("included_guests") or 1, 1, 30)
        included = _count(src.get("included_guests"), guests, 1, 30)
        extra = max(0, guests - included)
        push("nights", amount * nights)
        push("cleaning", money(src.get("cleaning_fee")))
        push("extra_guests", money(src.get("extra_guest_fee")) * extra * nights)
        due = sum(line["amount"] for line in lines)
        return {"lines": lines, "due": due, "deposit": deposit, "total": due}

    if category in HOME_CATEGORIES and src.get("listing_type") == "sale":
        push("price", amount)
        due = sum(line["amount"] for line in lines)
        return {"lines": lines, "due": due, "deposit": 0, "total": due}

    if category == "plots":
        push("price", amount)
        due = sum(line["amount"] for line in lines)
        return {"lines": lines, "due": due, "deposit": money(src.get("booking_deposit")), "total": due}

    if category == "vifaa":
        qty = _count(stay.get("quantity", src.get("min_order")), 1, 1, 100000)
        push("goods", amount * qty)
        push("delivery", money(src.get("delivery_fee")))
        due = sum(line["amount"] for line in lines)
        return {"lines": lines, "due": due, "deposit": 0, "total": due}

    months = _count(src.get("months_advance"), 1, 1, 24)
    godown = category == "store_godown" and (src.get("subtype") == "godown" or money(src.get("price_per_sqm")) > 0)
    if godown and money(src.get("size_m2")) > 0:
        sqm = money(src.get("size_m2"))
        rate = money(src.get("price_per_sqm")) or amount
        month = rate * sqm
        if src.get("vat") == "excluded":
            month = int(round(month * VAT))
        push("rent", month * months)
        push("deposit", deposit)
        due = sum(line["amount"] for line in lines)
        return {"lines": lines, "due": due, "deposit": deposit, "total": due}

    push("rent", amount * months)
    push("deposit", deposit)
    push("agent_fee", money(src.get("agent_fee")))
    push("other_fee", money(src.get("other_fee")))
    if category in {"frame", "store_godown"}:
        push("goodwill", money(src.get("goodwill")))
    due = sum(line["amount"] for line in lines)
    return {"lines": lines, "due": due, "deposit": deposit, "total": due}


def _when(value: str | None):
    if not value:
        return None
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_stale(item: dict, now: datetime | None = None) -> bool:
    stamp = _when((item.get("fit") or {}).get("last_confirmed_at") or item.get("last_confirmed_at"))
    if stamp is None:
        return False
    clock = now or datetime.now(timezone.utc)
    return clock - stamp > timedelta(days=STALE_DAYS)


def needs_confirm(item: dict, now: datetime | None = None) -> bool:
    stamp = _when((item.get("fit") or {}).get("last_confirmed_at") or item.get("last_confirmed_at"))
    if stamp is None:
        return False
    clock = now or datetime.now(timezone.utc)
    return clock - stamp > timedelta(days=CONFIRM_DAYS)


def dates_overlap(start_a, end_a, start_b, end_b) -> bool:
    return start_a < end_b and start_b < end_a


def review_allowed(kind: str, status: str) -> bool:
    if kind == "viewing":
        return status == "accepted"
    if kind == "stay":
        return status == "completed"
    return False


def payment_confirmed(provider_status: str) -> bool:
    return provider_status == "confirmed"
