"""Verification badges and listing view counts.

The client cannot set is_verified. Admin routes call require_admin.
Public payloads expose is_verified and verified_type only — never document numbers,
storage keys, or selfies. ID numbers are HMAC'd and discarded.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from app.security import (
    account_status,
    badge_public,
    current_user,
    db,
    limiter,
    load_env,
    profile_of,
    require_admin,
)

router = APIRouter()

# Eligibility and retention. One place on purpose.
ACCOUNT_MIN_DAYS = 7
REJECT_COOLDOWN_HOURS = 24
SIGNED_URL_SECONDS = 300
DOC_RETENTION_DAYS = int(os.getenv("DOC_RETENTION_DAYS", "30") or "30")
VERIFICATION_BUCKET = os.getenv("VERIFICATION_BUCKET", "verification-private")

DOC_TYPES = {
    "nida",
    "passport",
    "driving_licence",
    "voter_card",
    "business_license",
    "tin",
}
INDIVIDUAL_DOCS = {"nida", "passport", "driving_licence", "voter_card"}
BUSINESS_DOCS = {"business_license", "tin"}
REASON_CODES = {"blurry", "name_mismatch", "expired", "unsupported_document", "suspected_fake", "duplicate"}
SLOTS = {"front", "back", "selfie", "business", "shop"}
BOT_MARKERS = ("bot", "crawl", "spider", "slurp", "facebookexternalhit", "preview", "wget", "curl/")


class ProfilePatch(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    model_config = {"extra": "ignore"}


class UploadSlots(BaseModel):
    slots: list[str]
    model_config = {"extra": "ignore"}


class VerificationIn(BaseModel):
    type: str
    legal_name: str
    doc_type: str
    document_number: str = ""
    front_key: str = ""
    back_key: str | None = None
    selfie_key: str | None = None
    business_doc_key: str | None = None
    shop_key: str | None = None
    consent: bool = False
    model_config = {"extra": "ignore"}


class DecisionIn(BaseModel):
    action: str
    reason_code: str = ""
    note: str = ""
    model_config = {"extra": "ignore"}


class GrantIn(BaseModel):
    note: str
    verified_type: str = "individual"
    model_config = {"extra": "ignore"}


class RevokeIn(BaseModel):
    note: str
    reason: str
    model_config = {"extra": "ignore"}


class ReportIn(BaseModel):
    target_type: str
    target_id: str
    reason_code: str = "impersonation"
    note: str = ""
    model_config = {"extra": "ignore"}


def _secret() -> str:
    explicit = os.getenv("VERIFICATION_HMAC_SECRET", "").strip()
    if explicit:
        return explicit
    _, _, service = load_env()
    return service


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None = None) -> str:
    return (value or _now()).isoformat()


def _missing_column(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "column" in msg or "schema cache" in msg or "pgrst204" in msg or "does not exist" in msg or "relation" in msg


def _patch_profile(user_id: str, fields: dict) -> None:
    data = dict(fields)
    while data:
        try:
            db().table("profiles").update(data).eq("id", user_id).execute()
            return
        except Exception as exc:
            if not _missing_column(exc):
                return
            msg = str(exc).lower()
            dropped = False
            for key in list(data):
                if key.lower() in msg:
                    data.pop(key, None)
                    dropped = True
            if not dropped:
                data.pop(next(iter(data)))


def _fingerprint(doc_type: str, number: str) -> str:
    raw = f"{doc_type}:{re.sub(r'[^a-z0-9]', '', number.lower())}"
    return hmac.new(_secret().encode(), raw.encode(), hashlib.sha256).hexdigest()


def _norm_name(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-zA-Z ]", " ", text).lower()
    return re.sub(r"\s+", " ", text).strip()


def _ratio(a: str, b: str) -> float:
    if a == b:
        return 1.0
    la, lb = len(a), len(b)
    if not la or not lb:
        return 0.0
    prev = list(range(lb + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[-1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return 1 - prev[-1] / max(la, lb)


def names_resemble(a: str, b: str) -> bool:
    left, right = _norm_name(a), _norm_name(b)
    if len(left) < 2 or len(right) < 2:
        return False
    if left == right or left in right or right in left:
        return True
    lw, rw = left.split(), right.split()
    if set(lw) & set(rw):
        return True
    if len(lw) > 1 and len(rw) > 1 and "".join(w[0] for w in lw) == "".join(w[0] for w in rw):
        return True
    if lw and all(len(w) == 1 for w in lw) and "".join(lw) == "".join(w[0] for w in rw if w):
        return True
    return _ratio(left, right) >= 0.78


def _audit(user_id: str | None, action: str, request_id: str | None, actor: str | None, note: str = "", reason_code: str = "") -> None:
    row = {
        "actor_id": actor,
        "user_id": user_id,
        "request_id": request_id,
        "action": action[:40],
        "reason_code": (reason_code or "")[:40] or None,
        "note": (note or "")[:500] or None,
    }
    try:
        db().table("verification_audit").insert(row).execute()
    except Exception:
        return


def on_display_name_change(user_id: str, previous: dict | None, full_name: str) -> None:
    prev = previous or {}
    if not prev.get("is_verified"):
        return
    old = str(prev.get("full_name") or "").strip().lower()
    if old == (full_name or "").strip().lower():
        return
    _patch_profile(user_id, {"is_verified": False})
    _audit(user_id, "name_change_hold", None, actor=user_id, note="display name changed")


def _phone(profile: dict, user) -> str:
    meta = getattr(user, "user_metadata", None) or {}
    if not isinstance(meta, dict):
        meta = {}
    return str(profile.get("phone") or getattr(user, "phone", None) or meta.get("phone") or "").strip()


def _avatar(profile: dict, user) -> str:
    meta = getattr(user, "user_metadata", None) or {}
    if not isinstance(meta, dict):
        meta = {}
    return str(profile.get("avatar_url") or profile.get("photo_url") or meta.get("avatar_url") or "").strip()


def _age_ok(profile: dict, user) -> bool:
    raw = profile.get("created_at") or getattr(user, "created_at", None)
    if not raw:
        return False
    try:
        text = str(raw).replace("Z", "+00:00")
        created = datetime.fromisoformat(text)
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
    except ValueError:
        return False
    return _now() - created >= timedelta(days=ACCOUNT_MIN_DAYS)


def _has_listing(user_id: str) -> bool:
    try:
        res = db().table("listings").select("id").eq("owner_id", user_id).eq("status", "active").limit(1).execute()
    except Exception:
        return False
    return bool(res.data)


def _latest_request(user_id: str) -> dict | None:
    try:
        res = (
            db()
            .table("verification_requests")
            .select("id,user_id,type,legal_name,doc_type,status,reason_code,submitted_at,decided_at,flagged")
            .eq("user_id", user_id)
            .order("submitted_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None
    rows = res.data or []
    return rows[0] if rows else None


def eligibility_for(user) -> dict:
    profile = profile_of(user.id) or {}
    items = [
        {"id": "photo", "ok": bool(_avatar(profile, user)), "href": "/hakiki#photo"},
        {"id": "name", "ok": len(str(profile.get("full_name") or "").strip()) >= 2, "href": "/hakiki#name"},
        {"id": "phone", "ok": len(re.sub(r"\D", "", _phone(profile, user))) >= 9, "href": "/hakiki#phone"},
        {"id": "listing", "ok": _has_listing(user.id), "href": "/weka-tangazo"},
        {"id": "age", "ok": _age_ok(profile, user), "href": ""},
        {"id": "hold", "ok": account_status(profile, user) != "suspended" and not profile.get("moderation_hold"), "href": ""},
    ]
    return {"eligible": all(item["ok"] for item in items), "items": items, "min_days": ACCOUNT_MIN_DAYS}


def _public_request(row: dict | None, profile: dict) -> dict | None:
    if not row and not profile.get("revoked_at") and not profile.get("is_verified"):
        return None
    status = (row or {}).get("status")
    if profile.get("revoked_at") and not profile.get("is_verified"):
        status = "revoked"
    elif profile.get("is_verified"):
        status = "approved"
    elif status == "approved" and not profile.get("is_verified"):
        status = "needs_review"
    retry_at = None
    decided = (row or {}).get("decided_at")
    if (row or {}).get("status") == "rejected" and decided:
        try:
            text = str(decided).replace("Z", "+00:00")
            when = datetime.fromisoformat(text)
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
            retry = when + timedelta(hours=REJECT_COOLDOWN_HOURS)
            if retry > _now():
                retry_at = retry.isoformat()
        except ValueError:
            retry_at = None
    badge = badge_public(profile)
    return {
        "id": (row or {}).get("id"),
        "status": status,
        "type": (row or {}).get("type") or badge["verified_type"],
        "reason_code": (row or {}).get("reason_code") if status in {"rejected", "revoked", "needs_review"} else None,
        "revoked_reason": profile.get("revoked_reason") if status == "revoked" else None,
        "submitted_at": (row or {}).get("submitted_at"),
        "decided_at": (row or {}).get("decided_at") or profile.get("revoked_at"),
        "retry_at": retry_at,
        "is_verified": badge["is_verified"],
        "verified_type": badge["verified_type"],
    }


def _owned_key(user_id: str, key: str | None) -> str | None:
    if not key:
        return None
    clean = str(key).split("?")[0].lstrip("/")
    if ".." in clean or not clean.startswith(f"{user_id}/"):
        raise HTTPException(status_code=400, detail="Invalid upload")
    return clean


def _sign_upload(key: str) -> dict:
    _ensure_bucket()
    signed = db().storage.from_(VERIFICATION_BUCKET).create_signed_upload_url(key)
    payload = signed if isinstance(signed, dict) else {}
    if not payload and signed is not None:
        data = getattr(signed, "data", None)
        if isinstance(data, dict):
            payload = data
        else:
            payload = {name: getattr(signed, name) for name in ("signed_url", "signedUrl", "token", "path") if hasattr(signed, name)}
    url = payload.get("signed_url") or payload.get("signedUrl") or payload.get("signedURL") or ""
    return {"key": key, "signed_url": url, "token": payload.get("token") or ""}


def _sign_read(key: str | None) -> str | None:
    if not key:
        return None
    try:
        signed = db().storage.from_(VERIFICATION_BUCKET).create_signed_url(key, SIGNED_URL_SECONDS)
    except Exception:
        return None
    payload = signed if isinstance(signed, dict) else getattr(signed, "data", None) or {}
    if not isinstance(payload, dict):
        payload = {}
    return payload.get("signedURL") or payload.get("signed_url") or payload.get("signedUrl")


def _ensure_bucket() -> None:
    try:
        db().storage.create_bucket(
            VERIFICATION_BUCKET,
            options={"public": False, "file_size_limit": str(6 * 1024 * 1024)},
        )
    except Exception:
        return


def strip_jpeg_exif(data: bytes) -> bytes:
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return data
    out = bytearray(data[:2])
    i = 2
    while i + 1 < len(data):
        if data[i] != 0xFF:
            out.extend(data[i:])
            break
        marker = data[i + 1]
        if marker == 0xDA:
            out.extend(data[i:])
            break
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            out.extend(data[i : i + 2])
            i += 2
            continue
        if i + 4 > len(data):
            break
        length = int.from_bytes(data[i + 2 : i + 4], "big")
        if length < 2 or i + 2 + length > len(data):
            break
        if marker != 0xE1:
            out.extend(data[i : i + 2 + length])
        i += 2 + length
    return bytes(out)


def _views_count(listing_id: str) -> int:
    try:
        res = db().table("listings").select("views_count").eq("id", listing_id).limit(1).execute()
        rows = res.data or []
        if rows and rows[0].get("views_count") is not None:
            return int(rows[0]["views_count"])
    except Exception:
        pass
    try:
        res = db().table("listing_views").select("id").eq("listing_id", listing_id).execute()
        return len(res.data or [])
    except Exception:
        return 0


def _listing_brief(listing_id: str) -> dict:
    try:
        res = db().table("listings").select("id,owner_id,status,views_count").eq("id", listing_id).limit(1).execute()
    except Exception:
        res = db().table("listings").select("id,owner_id,status").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    return rows[0]


def _optional_user(request: Request):
    header = request.headers.get("authorization")
    if not header:
        return None
    try:
        return current_user(header)
    except HTTPException:
        return None


def _viewer_key(request: Request, user) -> str:
    if user is not None:
        return f"u:{user.id}"
    device = (request.headers.get("x-device-id") or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{8,80}", device):
        device = request.client.host if request.client else "anon"
    digest = hmac.new(_secret().encode(), device.encode(), hashlib.sha256).hexdigest()
    return f"d:{digest}"


def record_view(listing_id: str, viewer_key: str) -> tuple[bool, int]:
    day = _now().date().isoformat()
    try:
        res = db().rpc(
            "record_listing_view",
            {"p_listing": listing_id, "p_viewer": viewer_key, "p_day": day},
        ).execute()
        row = res.data[0] if isinstance(res.data, list) and res.data else res.data
        if isinstance(row, dict) and "counted" in row:
            return bool(row.get("counted")), int(row.get("views_count") or 0)
    except Exception:
        pass
    inserted = False
    try:
        db().table("listing_views").insert({"listing_id": listing_id, "viewer_key": viewer_key, "day": day}).execute()
        inserted = True
    except Exception as exc:
        msg = str(exc).lower()
        if "duplicate" in msg or "unique" in msg or "23505" in msg:
            inserted = False
        elif _missing_column(exc):
            return False, _views_count(listing_id)
        else:
            return False, _views_count(listing_id)
    column = None
    try:
        res = db().table("listings").select("views_count").eq("id", listing_id).limit(1).execute()
        rows = res.data or []
        if rows and "views_count" in rows[0] and rows[0].get("views_count") is not None:
            column = int(rows[0]["views_count"])
        elif rows and "views_count" in rows[0]:
            column = 0
    except Exception:
        column = None
    if column is not None:
        total = column + (1 if inserted else 0)
        if inserted:
            try:
                db().table("listings").update({"views_count": total}).eq("id", listing_id).execute()
            except Exception:
                pass
        return inserted, total
    return inserted, _views_count(listing_id)


def attach_week_views(items: list[dict]) -> None:
    ids = [str(item.get("id")) for item in items if item.get("id")]
    if not ids:
        return
    start = (_now().date() - timedelta(days=6)).isoformat()
    try:
        res = db().table("listing_views").select("listing_id,day").in_("listing_id", ids).gte("day", start).execute()
    except Exception:
        return
    counts: dict[str, int] = {}
    for row in res.data or []:
        lid = str(row.get("listing_id") or "")
        counts[lid] = counts.get(lid, 0) + 1
    for item in items:
        item["views_7d"] = counts.get(str(item.get("id")), 0)


def purge_expired() -> None:
    try:
        res = (
            db()
            .table("verification_requests")
            .select("id,front_key,back_key,selfie_key,business_doc_key,shop_key")
            .lte("delete_after", _iso())
            .limit(30)
            .execute()
        )
    except Exception:
        return
    for row in res.data or []:
        keys = [row.get(name) for name in ("front_key", "back_key", "selfie_key", "business_doc_key", "shop_key")]
        live = [key for key in keys if key]
        if live:
            try:
                db().storage.from_(VERIFICATION_BUCKET).remove(live)
            except Exception:
                pass
        try:
            db().table("verification_requests").update(
                {
                    "front_key": None,
                    "back_key": None,
                    "selfie_key": None,
                    "business_doc_key": None,
                    "shop_key": None,
                    "delete_after": None,
                }
            ).eq("id", row["id"]).execute()
        except Exception:
            continue


def _admin(user=Depends(current_user)):
    require_admin(user)
    return user


@router.get("/verification/eligibility")
def verification_eligibility(user=Depends(current_user)):
    return eligibility_for(user)


@router.get("/verification/requests/me")
def verification_me(user=Depends(current_user)):
    profile = profile_of(user.id) or {}
    badge = badge_public(profile)
    return {
        "is_verified": badge["is_verified"],
        "verified_type": badge["verified_type"],
        "request": _public_request(_latest_request(user.id), profile),
    }


@router.post("/verification/profile")
def verification_profile(body: ProfilePatch, user=Depends(current_user)):
    fields: dict = {}
    if body.full_name is not None:
        name = body.full_name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Name is required")
        previous = profile_of(user.id)
        fields["full_name"] = name[:120]
        _patch_profile(user.id, fields)
        on_display_name_change(user.id, previous, name)
        fields = {}
    if body.phone is not None:
        digits = re.sub(r"\D", "", body.phone)
        if len(digits) < 9 or len(digits) > 15:
            raise HTTPException(status_code=400, detail="Enter a phone number")
        fields["phone"] = body.phone.strip()[:20]
    if fields:
        _patch_profile(user.id, fields)
    return eligibility_for(user)


@router.post("/verification/avatar")
async def verification_avatar(file: UploadFile = File(...), user=Depends(current_user)):
    from app.uploads import save_listing_photo

    url = save_listing_photo(user.id, file)
    _patch_profile(user.id, {"avatar_url": url})
    return {"avatar_url": url, **eligibility_for(user)}


@router.post("/verification/uploads")
def verification_uploads(body: UploadSlots, user=Depends(current_user)):
    slots = [slot for slot in body.slots if slot in SLOTS][:6]
    if not slots:
        raise HTTPException(status_code=400, detail="Choose a photo slot")
    out = {}
    for slot in slots:
        key = f"{user.id}/{uuid4().hex}.jpg"
        try:
            out[slot] = _sign_upload(key)
        except Exception:
            raise HTTPException(status_code=503, detail="Private storage is not ready")
    return {"uploads": out, "expires_in": SIGNED_URL_SECONDS}


@router.post("/verification/uploads/file")
async def verification_upload_file(slot: str, file: UploadFile = File(...), user=Depends(current_user)):
    if slot not in SLOTS:
        raise HTTPException(status_code=400, detail="Choose a photo slot")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty photo")
    if len(data) > 6 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Photo is too large")
    data = strip_jpeg_exif(data)
    key = f"{user.id}/{uuid4().hex}.jpg"
    _ensure_bucket()
    try:
        db().storage.from_(VERIFICATION_BUCKET).upload(
            key,
            data,
            file_options={"content-type": "image/jpeg", "upsert": "false"},
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Private storage is not ready")
    return {"key": key}


@router.post("/verification/requests")
def create_verification(body: VerificationIn, user=Depends(current_user)):
    gate = eligibility_for(user)
    if not gate["eligible"]:
        raise HTTPException(status_code=400, detail="Finish the checklist before you apply")
    if not body.consent:
        raise HTTPException(status_code=400, detail="Consent is required")
    kind = body.type.strip().lower()
    if kind not in {"individual", "business"}:
        raise HTTPException(status_code=400, detail="Choose individual or business")
    doc = body.doc_type.strip().lower()
    if doc not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported document")
    if kind == "individual" and doc not in INDIVIDUAL_DOCS:
        raise HTTPException(status_code=400, detail="Unsupported document")
    if kind == "business" and doc not in BUSINESS_DOCS:
        raise HTTPException(status_code=400, detail="Unsupported document")
    number = re.sub(r"\s+", "", body.document_number or "")
    if len(number) < 4 or len(number) > 40:
        raise HTTPException(status_code=400, detail="Enter the document number exactly as printed")
    legal = body.legal_name.strip()
    if len(legal) < 2:
        raise HTTPException(status_code=400, detail="Enter the name exactly as printed")
    current = _latest_request(user.id)
    if current and current.get("status") == "pending":
        raise HTTPException(status_code=409, detail="A request is already being reviewed")
    profile = profile_of(user.id) or {}
    public = _public_request(current, profile)
    if public and public.get("retry_at"):
        raise HTTPException(status_code=429, detail="You can try again after the cooldown")
    front = _owned_key(user.id, body.front_key)
    if not front:
        raise HTTPException(status_code=400, detail="The front of the document is required")
    back = _owned_key(user.id, body.back_key)
    selfie = _owned_key(user.id, body.selfie_key)
    business_doc = _owned_key(user.id, body.business_doc_key)
    shop = _owned_key(user.id, body.shop_key)
    if kind == "individual" and not selfie:
        raise HTTPException(status_code=400, detail="A selfie is required")
    if kind == "business" and not business_doc:
        raise HTTPException(status_code=400, detail="A business licence or TIN photo is required")
    digest = _fingerprint(doc, number)
    flagged = False
    try:
        clash = (
            db()
            .table("verification_requests")
            .select("id,user_id")
            .eq("fingerprint", digest)
            .limit(5)
            .execute()
        )
        flagged = any(str(row.get("user_id")) != str(user.id) for row in (clash.data or []))
    except Exception:
        flagged = False
    row = {
        "user_id": user.id,
        "type": kind,
        "legal_name": legal[:160],
        "doc_type": doc,
        "fingerprint": digest,
        "front_key": front,
        "back_key": back,
        "selfie_key": selfie,
        "business_doc_key": business_doc,
        "shop_key": shop,
        "status": "rejected" if flagged else "pending",
        "reason_code": "duplicate" if flagged else None,
        "flagged": flagged,
        "submitted_at": _iso(),
        "decided_at": _iso() if flagged else None,
        "delete_after": _iso(_now() + timedelta(days=DOC_RETENTION_DAYS)) if flagged else None,
    }
    try:
        res = db().table("verification_requests").insert(row).execute()
    except Exception:
        raise HTTPException(status_code=503, detail="Verification storage is not ready")
    saved = (res.data or [row])[0]
    _audit(user.id, "reject" if flagged else "submit", saved.get("id"), actor=user.id, reason_code="duplicate" if flagged else "")
    if flagged:
        raise HTTPException(status_code=400, detail="We could not verify this document. Contact support if this is yours.")
    fresh = profile_of(user.id) or profile
    return _public_request(saved, fresh)


@router.get("/admin/verification/queue")
def verification_queue(user=Depends(_admin), status: str = "pending"):
    purge_expired()
    allowed = {"pending", "approved", "rejected", "flagged"}
    if status not in allowed:
        status = "pending"
    try:
        query = db().table("verification_requests").select(
            "id,user_id,type,legal_name,doc_type,status,reason_code,flagged,submitted_at,decided_at"
        )
        if status == "flagged":
            query = query.eq("flagged", True)
        else:
            query = query.eq("status", status)
        res = query.order("submitted_at", desc=False).limit(80).execute()
    except Exception:
        return {"items": []}
    return {"items": res.data or []}


@router.get("/admin/verification/{request_id}")
def verification_detail(request_id: str, user=Depends(_admin)):
    try:
        res = db().table("verification_requests").select("*").eq("id", request_id).limit(1).execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    row = dict(rows[0])
    row.pop("fingerprint", None)
    profile = profile_of(str(row.get("user_id") or "")) or {}
    photos = {
        name: _sign_read(row.get(key))
        for name, key in (
            ("front", "front_key"),
            ("back", "back_key"),
            ("selfie", "selfie_key"),
            ("business", "business_doc_key"),
            ("shop", "shop_key"),
        )
    }
    try:
        audit = (
            db()
            .table("verification_audit")
            .select("id,actor_id,user_id,action,reason_code,note,created_at")
            .eq("request_id", request_id)
            .order("created_at", desc=True)
            .limit(40)
            .execute()
        )
        trail = audit.data or []
    except Exception:
        trail = []
    for key in ("front_key", "back_key", "selfie_key", "business_doc_key", "shop_key", "fingerprint"):
        row.pop(key, None)
    return {
        "request": row,
        "photos": photos,
        "expires_in": SIGNED_URL_SECONDS,
        "profile_name": profile.get("full_name"),
        "profile_username": profile.get("username"),
        "name_match": names_resemble(str(row.get("legal_name") or ""), str(profile.get("full_name") or "")),
        "is_verified": badge_public(profile)["is_verified"],
        "verified_type": badge_public(profile)["verified_type"],
        "audit": trail,
        "reviewer_id": user.id,
    }


@router.post("/admin/verification/{request_id}/decision")
def verification_decision(request_id: str, body: DecisionIn, user=Depends(_admin)):
    action = body.action.strip().lower()
    if action not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Choose approve or reject")
    note = body.note.strip()
    if len(note) < 3:
        raise HTTPException(status_code=400, detail="A note is required")
    reason = body.reason_code.strip().lower()
    if action == "reject" and reason not in REASON_CODES:
        raise HTTPException(status_code=400, detail="Choose a reason")
    try:
        res = db().table("verification_requests").select("*").eq("id", request_id).limit(1).execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    row = rows[0]
    if row.get("status") != "pending":
        raise HTTPException(status_code=400, detail="This request is already decided")
    profile = profile_of(str(row.get("user_id") or "")) or {}
    if action == "approve" and not names_resemble(str(row.get("legal_name") or ""), str(profile.get("full_name") or "")):
        raise HTTPException(status_code=400, detail="The profile name does not match the document")
    decided = _iso()
    delete_after = _iso(_now() + timedelta(days=max(1, DOC_RETENTION_DAYS)))
    patch = {
        "status": "approved" if action == "approve" else "rejected",
        "reason_code": None if action == "approve" else reason,
        "reviewer_note": note[:500],
        "reviewer": user.id,
        "decided_at": decided,
        "delete_after": delete_after,
    }
    db().table("verification_requests").update(patch).eq("id", request_id).execute()
    owner = str(row.get("user_id"))
    if action == "approve":
        _patch_profile(
            owner,
            {
                "is_verified": True,
                "verified_type": row.get("type"),
                "verified_at": decided,
                "verified_by": user.id,
                "verified_name": str(profile.get("full_name") or "")[:120],
                "revoked_at": None,
                "revoked_reason": None,
            },
        )
    _audit(owner, action, request_id, actor=user.id, note=note, reason_code="" if action == "approve" else reason)
    return {"ok": True, "status": patch["status"]}


@router.post("/admin/users/{user_id}/grant-badge")
def grant_badge(user_id: str, body: GrantIn, user=Depends(_admin)):
    note = body.note.strip()
    if len(note) < 8:
        raise HTTPException(status_code=400, detail="A note is required")
    kind = body.verified_type if body.verified_type in {"individual", "business"} else "individual"
    target = profile_of(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    decided = _iso()
    _patch_profile(
        user_id,
        {
            "is_verified": True,
            "verified_type": kind,
            "verified_at": decided,
            "verified_by": user.id,
            "verified_name": str(target.get("full_name") or "")[:120],
            "revoked_at": None,
            "revoked_reason": None,
        },
    )
    _audit(user_id, "grant", None, actor=user.id, note=note)
    return {"ok": True, **badge_public(profile_of(user_id) or {})}


@router.post("/admin/users/{user_id}/revoke-badge")
def revoke_badge(user_id: str, body: RevokeIn, user=Depends(_admin)):
    note = body.note.strip()
    reason = body.reason.strip()
    if len(note) < 8 or len(reason) < 3:
        raise HTTPException(status_code=400, detail="A note and a reason are required")
    if not profile_of(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    when = _iso()
    _patch_profile(
        user_id,
        {
            "is_verified": False,
            "revoked_at": when,
            "revoked_reason": reason[:240],
        },
    )
    _audit(user_id, "revoke", None, actor=user.id, note=note, reason_code="revoke")
    return {"ok": True, "is_verified": False, "verified_type": None, "revoked_reason": reason[:240]}


@router.post("/listings/{listing_id}/views")
def post_listing_view(listing_id: str, request: Request):
    ua = (request.headers.get("user-agent") or "").lower()
    listing = _listing_brief(listing_id)
    if (listing.get("status") or "active") != "active":
        raise HTTPException(status_code=404, detail="Listing not found")
    total = _views_count(listing_id)
    if any(marker in ua for marker in BOT_MARKERS):
        return {"counted": False, "views_count": total}
    user = _optional_user(request)
    if user is not None and str(listing.get("owner_id") or "") == str(user.id):
        return {"counted": False, "views_count": total}
    host = request.client.host if request.client else "unknown"
    device = (request.headers.get("x-device-id") or host)[:80]
    limiter.check(f"view:{host}", 60, 60, "Try again later")
    limiter.check(f"viewdev:{device}", 40, 60, "Try again later")
    counted, views = record_view(listing_id, _viewer_key(request, user))
    return {"counted": counted, "views_count": views}


@router.post("/reports")
def create_report(body: ReportIn, user=Depends(current_user)):
    target = body.target_type.strip().lower()
    if target not in {"listing", "profile"}:
        raise HTTPException(status_code=400, detail="Unsupported report")
    reason = body.reason_code.strip().lower()
    allowed = {
        "impersonation",
        "scam",
        "wrong_info",
        "fake_photos",
        "photo_mismatch",
        "fee_before_viewing",
        "already_taken",
        "harassment",
        "other",
    }
    if reason not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported report")
    ident = body.target_id.strip()[:80]
    if len(ident) < 2:
        raise HTTPException(status_code=400, detail="Tell us which account")
    try:
        db().table("reports").insert(
            {
                "reporter_id": user.id,
                "target_type": target,
                "target_id": ident,
                "reason_code": reason,
                "note": (body.note or "")[:240] or None,
            }
        ).execute()
    except Exception:
        raise HTTPException(status_code=503, detail="Reports are not ready")
    if target == "listing":
        try:
            found = db().table("reports").select("id").eq("target_type", "listing").eq("target_id", ident).execute()
            if len(found.data or []) >= 3:
                db().table("listings").update({"status": "hidden"}).eq("id", ident).execute()
        except Exception:
            pass
    return {"ok": True}
