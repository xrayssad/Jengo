"""Viewings, stays, reviews and a mock payment provider.

Business rules live here. A missing table fails the request instead of pretending it succeeded.
Payments stay off until PAYMENTS_ENABLED=1. A typed reference is never treated as proof.
"""

from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.pricing import clean_fit, dates_overlap, payment_confirmed, quote_stay, review_allowed
from app.security import current_user, db

router = APIRouter()

PAYMENTS_ENABLED = os.getenv("PAYMENTS_ENABLED", "").strip().lower() in {"1", "true", "yes"}
PAYMENTS_WEBHOOK_SECRET = os.getenv("PAYMENTS_WEBHOOK_SECRET", "")


class ViewingIn(BaseModel):
    visit_date: str
    slot: str


class ViewingDecisionIn(BaseModel):
    status: str


class StayIn(BaseModel):
    start_date: str
    end_date: str
    guests: int = 1


class StayDecisionIn(BaseModel):
    status: str


class ReviewIn(BaseModel):
    interaction_id: str
    interaction_kind: str
    ratings: dict = {}
    body: str = ""


class ReplyIn(BaseModel):
    body: str


class AvailabilityIn(BaseModel):
    status: str


class PaymentIn(BaseModel):
    listing_id: str
    amount: int


class WebhookIn(BaseModel):
    provider_ref: str
    status: str
    secret: str = ""


def _missing(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "column" in msg or "pgrst204" in msg or "schema cache" in msg or "relation" in msg or "does not exist" in msg


def _parse_date(value: str) -> date:
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date") from exc


def _listing(listing_id: str) -> dict:
    res = db().table("listings").select("*").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    return rows[0]


def _owner_fit(row: dict) -> dict:
    fit = row.get("attributes") if isinstance(row.get("attributes"), dict) else {}
    return fit


@router.post("/listings/{listing_id}/availability")
def confirm_availability(listing_id: str, body: AvailabilityIn, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the owner can update availability")
    status = body.status if body.status in {"active", "rented", "sold", "paused"} else ""
    if not status:
        raise HTTPException(status_code=400, detail="Invalid status")
    stored = "active" if status == "active" else "hidden"
    now = datetime.now(timezone.utc).isoformat()
    fit = dict(_owner_fit(row))
    fit["last_confirmed_at"] = now
    fit["availability"] = status
    patch = {"status": stored, "last_confirmed_at": now, "attributes": fit}
    try:
        res = db().table("listings").update(patch).eq("id", listing_id).execute()
    except Exception as exc:
        if not _missing(exc):
            raise
        res = db().table("listings").update({"status": stored}).eq("id", listing_id).execute()
    rows = res.data or []
    return {"id": listing_id, "status": status, "last_confirmed_at": now, "saved": bool(rows)}


@router.post("/listings/{listing_id}/viewings")
def request_viewing(listing_id: str, body: ViewingIn, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") == user.id:
        raise HTTPException(status_code=400, detail="You cannot request your own listing")
    slot = body.slot if body.slot in {"morning", "afternoon", "evening"} else ""
    if not slot:
        raise HTTPException(status_code=400, detail="Choose a time of day")
    visit = _parse_date(body.visit_date)
    if visit < date.today():
        raise HTTPException(status_code=400, detail="Choose a future day")
    record = {
        "id": str(uuid4()),
        "listing_id": listing_id,
        "user_id": user.id,
        "visit_date": visit.isoformat(),
        "slot": slot,
        "status": "pending",
    }
    try:
        res = db().table("viewing_requests").insert(record).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Viewing requests are not ready yet") from exc
        raise
    return (res.data or [record])[0]


@router.post("/viewings/{viewing_id}")
def decide_viewing(viewing_id: str, body: ViewingDecisionIn, user=Depends(current_user)):
    status = body.status if body.status in {"accepted", "declined"} else ""
    if not status:
        raise HTTPException(status_code=400, detail="Invalid decision")
    try:
        cur = db().table("viewing_requests").select("*").eq("id", viewing_id).limit(1).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Viewing requests are not ready yet") from exc
        raise
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    listing = _listing(str(rows[0].get("listing_id")))
    if str(listing.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the owner can decide")
    res = db().table("viewing_requests").update({"status": status}).eq("id", viewing_id).execute()
    return (res.data or [{"id": viewing_id, "status": status}])[0]


@router.get("/listings/{listing_id}/viewings")
def list_viewings(listing_id: str, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the owner can see requests")
    try:
        res = db().table("viewing_requests").select("*").eq("listing_id", listing_id).order("created_at", desc=True).limit(40).execute()
    except Exception as exc:
        if _missing(exc):
            return {"items": []}
        raise
    return {"items": res.data or []}


def _active_stays(listing_id: str) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    try:
        db().table("stays").update({"status": "expired"}).eq("listing_id", listing_id).eq("status", "pending").lt("created_at", cutoff).execute()
        res = db().table("stays").select("*").eq("listing_id", listing_id).in_("status", ["pending", "confirmed"]).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Bookings are not ready yet") from exc
        raise
    return res.data or []


@router.post("/listings/{listing_id}/stays/quote")
def stay_quote(listing_id: str, body: StayIn):
    row = _listing(listing_id)
    start = _parse_date(body.start_date)
    end = _parse_date(body.end_date)
    if end <= start:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    nights = (end - start).days
    fit = _owner_fit(row)
    low = int(fit.get("min_nights") or 1)
    high = int(fit.get("max_nights") or 90)
    if nights < low or nights > high:
        raise HTTPException(status_code=400, detail="Stay length is outside the host limits")
    return quote_stay(row.get("category") or "", row.get("price"), fit, {"nights": nights, "guests": body.guests})


@router.post("/listings/{listing_id}/stays")
def request_stay(listing_id: str, body: StayIn, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") == user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own listing")
    start = _parse_date(body.start_date)
    end = _parse_date(body.end_date)
    if end <= start or start < date.today():
        raise HTTPException(status_code=400, detail="Choose valid dates")
    for stay in _active_stays(listing_id):
        if dates_overlap(start, end, _parse_date(str(stay.get("start_date"))), _parse_date(str(stay.get("end_date")))):
            raise HTTPException(status_code=409, detail="Those dates are already requested")
    fit = _owner_fit(row)
    nights = (end - start).days
    quote = quote_stay(row.get("category") or "", row.get("price"), fit, {"nights": nights, "guests": body.guests})
    status = "confirmed" if fit.get("instant_book") else "pending"
    record = {
        "id": str(uuid4()),
        "listing_id": listing_id,
        "user_id": user.id,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "guests": body.guests,
        "total": quote["due"],
        "status": status,
    }
    try:
        res = db().table("stays").insert(record).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "stays_no_overlap" in msg or "23p01" in msg or "exclude" in msg:
            raise HTTPException(status_code=409, detail="Those dates are already requested") from exc
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Bookings are not ready yet") from exc
        raise
    saved = (res.data or [record])[0]
    saved["quote"] = quote
    return saved


@router.post("/stays/{stay_id}")
def decide_stay(stay_id: str, body: StayDecisionIn, user=Depends(current_user)):
    status = body.status if body.status in {"confirmed", "declined", "completed"} else ""
    if not status:
        raise HTTPException(status_code=400, detail="Invalid decision")
    try:
        cur = db().table("stays").select("*").eq("id", stay_id).limit(1).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Bookings are not ready yet") from exc
        raise
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Booking not found")
    listing = _listing(str(rows[0].get("listing_id")))
    if str(listing.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the host can decide")
    created = rows[0].get("created_at")
    if rows[0].get("status") == "pending" and status == "confirmed" and created:
        try:
            opened = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
            if opened.tzinfo is None:
                opened = opened.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - opened > timedelta(hours=24):
                db().table("stays").update({"status": "expired"}).eq("id", stay_id).execute()
                raise HTTPException(status_code=410, detail="This request expired after 24 hours")
        except HTTPException:
            raise
        except (TypeError, ValueError):
            pass
    res = db().table("stays").update({"status": status}).eq("id", stay_id).execute()
    return (res.data or [{"id": stay_id, "status": status}])[0]


def _interaction(kind: str, interaction_id: str, user_id: str) -> dict:
    table = "viewing_requests" if kind == "viewing" else "stays" if kind == "stay" else ""
    if not table:
        raise HTTPException(status_code=400, detail="Unknown interaction")
    try:
        res = db().table(table).select("*").eq("id", interaction_id).limit(1).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=403, detail="You cannot review this yet") from exc
        raise
    rows = res.data or []
    if not rows or str(rows[0].get("user_id") or "") != user_id:
        raise HTTPException(status_code=403, detail="You cannot review this yet")
    if not review_allowed(kind, str(rows[0].get("status") or "")):
        raise HTTPException(status_code=403, detail="You cannot review this yet")
    return rows[0]


@router.post("/listings/{listing_id}/reviews")
def write_review(listing_id: str, body: ReviewIn, user=Depends(current_user)):
    _listing(listing_id)
    interaction = _interaction(body.interaction_kind, body.interaction_id, user.id)
    if str(interaction.get("listing_id") or "") != listing_id:
        raise HTTPException(status_code=400, detail="That visit is for another listing")
    ratings = {}
    for key, value in (body.ratings or {}).items():
        try:
            score = int(value)
        except (TypeError, ValueError):
            continue
        if 1 <= score <= 5:
            ratings[str(key)[:40]] = score
        if len(ratings) >= 8:
            break
    if not ratings:
        raise HTTPException(status_code=400, detail="Add at least one rating")
    record = {
        "id": str(uuid4()),
        "listing_id": listing_id,
        "user_id": user.id,
        "interaction_id": body.interaction_id,
        "interaction_kind": body.interaction_kind,
        "ratings": ratings,
        "body": (body.body or "")[:800],
    }
    try:
        res = db().table("listing_reviews").insert(record).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Reviews are not ready yet") from exc
        raise
    return (res.data or [record])[0]


@router.post("/reviews/{review_id}/reply")
def reply_review(review_id: str, body: ReplyIn, user=Depends(current_user)):
    try:
        cur = db().table("listing_reviews").select("*").eq("id", review_id).limit(1).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Reviews are not ready yet") from exc
        raise
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Review not found")
    if rows[0].get("owner_reply"):
        raise HTTPException(status_code=400, detail="You already replied")
    listing = _listing(str(rows[0].get("listing_id")))
    if str(listing.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the owner can reply")
    text = (body.body or "").strip()[:800]
    if len(text) < 2:
        raise HTTPException(status_code=400, detail="Write a reply")
    res = db().table("listing_reviews").update({"owner_reply": text}).eq("id", review_id).execute()
    return (res.data or [{"id": review_id, "owner_reply": text}])[0]


class MockProvider:
    """Stand-in until a mobile-money aggregator is configured."""

    name = "mock"

    def start(self, payment: dict) -> dict:
        return {"provider": self.name, "provider_ref": f"mock_{payment['id']}", "status": "pending"}

    def confirm(self, payload: WebhookIn) -> str:
        if not PAYMENTS_WEBHOOK_SECRET or payload.secret != PAYMENTS_WEBHOOK_SECRET:
            raise HTTPException(status_code=401, detail="Invalid payment callback")
        if not payment_confirmed(payload.status):
            return "failed"
        return "confirmed"


def provider():
    return MockProvider()


@router.post("/payments")
def start_payment(body: PaymentIn, user=Depends(current_user)):
    if not PAYMENTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    _listing(body.listing_id)
    record = {
        "id": str(uuid4()),
        "listing_id": body.listing_id,
        "user_id": user.id,
        "provider": "mock",
        "provider_ref": "",
        "amount": body.amount,
        "status": "pending",
    }
    started = provider().start(record)
    record["provider_ref"] = started["provider_ref"]
    record["status"] = started["status"]
    try:
        res = db().table("payments").insert(record).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Payments are not ready yet") from exc
        raise
    return (res.data or [record])[0]


@router.post("/payments/webhook")
def payment_webhook(body: WebhookIn, request: Request):
    if not PAYMENTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")
    status = provider().confirm(body)
    try:
        res = db().table("payments").update({"status": status}).eq("provider_ref", body.provider_ref).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Payments are not ready yet") from exc
        raise
    if not res.data:
        raise HTTPException(status_code=404, detail="Payment not found")
    return res.data[0]


def note_reply(listing: dict, sender_id: str) -> None:
    """Median reply time from real owner replies. Hidden until there are 5."""
    owner = str(listing.get("owner_id") or "")
    if not owner:
        return
    attrs = dict(listing.get("attributes") or {})
    now = datetime.now(timezone.utc)
    if sender_id != owner:
        if not attrs.get("open_inquiry_at"):
            attrs["open_inquiry_at"] = now.isoformat()
        else:
            return
    else:
        opened = attrs.get("open_inquiry_at")
        if not opened:
            return
        try:
            start = datetime.fromisoformat(str(opened).replace("Z", "+00:00"))
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        except ValueError:
            return
        seconds = max(0, int((now - start).total_seconds()))
        samples = [int(n) for n in (attrs.get("reply_samples") or []) if isinstance(n, (int, float))]
        samples = (samples + [seconds])[-20:]
        attrs["reply_samples"] = samples
        attrs.pop("open_inquiry_at", None)
        if len(samples) >= 5:
            ordered = sorted(samples)
            mid = ordered[len(ordered) // 2]
            attrs["reply_within"] = "hour" if mid <= 3600 else "day" if mid <= 86400 else ""
    try:
        db().table("listings").update({"attributes": attrs}).eq("id", listing.get("id")).execute()
    except Exception as exc:
        if not _missing(exc):
            raise


class StorageIn(BaseModel):
    goods: str
    notes: str = ""
    start_date: str
    months: int = 1
    business: str = ""


@router.post("/listings/{listing_id}/storage")
def request_storage(listing_id: str, body: StorageIn, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") == user.id:
        raise HTTPException(status_code=400, detail="You cannot request your own listing")
    goods = body.goods.strip()[:160]
    if len(goods) < 2:
        raise HTTPException(status_code=400, detail="Say what you will store")
    start = _parse_date(body.start_date)
    record = {
        "id": str(uuid4()),
        "listing_id": listing_id,
        "user_id": user.id,
        "goods": goods,
        "notes": (body.notes or "")[:400],
        "start_date": start.isoformat(),
        "months": max(1, min(int(body.months or 1), 60)),
        "business": (body.business or "")[:120],
        "status": "pending",
    }
    try:
        res = db().table("storage_requests").insert(record).execute()
    except Exception as exc:
        if _missing(exc):
            raise HTTPException(status_code=503, detail="Storage requests are not ready yet") from exc
        raise
    saved = (res.data or [record])[0]
    saved["summary"] = _agreement(row, saved)
    return saved


def _agreement(listing: dict, request: dict) -> dict:
    fit = listing.get("attributes") if isinstance(listing.get("attributes"), dict) else {}
    return {
        "title": listing.get("title") or "",
        "size_m2": fit.get("size_m2"),
        "price": listing.get("price"),
        "months": request.get("months"),
        "deposit": fit.get("deposit"),
        "goods": request.get("goods"),
        "start_date": request.get("start_date"),
        "disclaimer": "This is a summary template, not legal advice.",
    }


@router.get("/listings/{listing_id}/stays")
def list_stays(listing_id: str, user=Depends(current_user)):
    row = _listing(listing_id)
    if str(row.get("owner_id") or "") != user.id:
        raise HTTPException(status_code=403, detail="Only the host can see bookings")
    try:
        res = db().table("stays").select("*").eq("listing_id", listing_id).order("created_at", desc=True).limit(40).execute()
    except Exception as exc:
        if _missing(exc):
            return {"items": []}
        raise
    return {"items": res.data or []}


@router.get("/listings/{listing_id}/review-eligibility")
def review_eligibility(listing_id: str, user=Depends(current_user)):
    _listing(listing_id)
    for kind, table, ok in (("viewing", "viewing_requests", "accepted"), ("stay", "stays", "completed")):
        try:
            res = (
                db().table(table)
                .select("id,status")
                .eq("listing_id", listing_id)
                .eq("user_id", user.id)
                .eq("status", ok)
                .limit(1)
                .execute()
            )
        except Exception:
            continue
        rows = res.data or []
        if rows:
            return {"can": True, "interaction_id": rows[0].get("id"), "interaction_kind": kind}
    return {"can": False}


def merge_body_fit(body) -> dict:
    raw = dict(body.attributes or {})
    for key in (
        "poster_role",
        "free_viewing",
        "direct_owner",
        "costs_confirmed",
        "negotiable",
        "instant_book",
        "bedrooms",
        "bathrooms",
        "room_type",
        "deposit",
        "available_from",
        "guests",
        "min_nights",
        "max_nights",
        "size_m2",
        "price_per_sqm",
        "frontage",
        "market_name",
        "frame_size",
        "min_order",
        "whatsapp",
        "landmark",
        "directions",
        "months_advance",
        "agent_fee",
        "other_fee",
        "cleaning_fee",
        "extra_guest_fee",
        "goodwill",
        "water",
        "electricity",
        "cancellation",
        "subtype",
        "truck",
        "vat",
        "currency",
        "power_backup",
        "delivery_fee",
        "included_guests",
        "beds",
        "floor",
        "suitable",
        "condition",
        "allowed_goods",
        "delivery_note",
        "ceiling",
        "license_note",
    ):
        value = getattr(body, key, None)
        if value is not None and value != "" and value != []:
            raw[key] = value
    amenities = getattr(body, "amenities", None)
    if amenities:
        raw["amenities"] = amenities
    return raw
