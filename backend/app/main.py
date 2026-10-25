import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.security import (
    LOGIN_ERROR,
    USERNAME_RE,
    anon,
    booking_message,
    commission_from_booking,
    current_user,
    db,
    decorate_listing,
    is_admin,
    limiter,
    profile_of,
    public_profile,
    qty_from_booking,
    require_admin,
    review_from_booking,
    with_meta,
)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Jengo API", version="1.0.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UNITS = {"mfuko", "tani", "kipande", "dei"}


class ListingIn(BaseModel):
    category: str
    title: str
    description: str = ""
    price: float
    period: str = ""
    location: str
    city: str = "Dar es Salaam"
    images: list[str] = Field(default_factory=list)
    unit: str | None = None
    stock: float | None = None


class BookingIn(BaseModel):
    listing_id: str
    message: str = ""
    quantity: float | None = None


class LikeIn(BaseModel):
    on: bool = True


class ListingStatusIn(BaseModel):
    status: str


class BookingStatusIn(BaseModel):
    status: str


class RegisterIn(BaseModel):
    email: str
    password: str
    username: str
    full_name: str


class LoginIn(BaseModel):
    email: str
    password: str


class VerifyIn(BaseModel):
    email: str
    code: str


class ResendIn(BaseModel):
    email: str


class SessionIn(BaseModel):
    access_token: str


class ReviewIn(BaseModel):
    booking_id: str
    rating: int
    comment: str = ""


def _save_row(table: str, row: dict, fallback: dict):
    try:
        return db().table(table).insert(row).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "column" in msg or "pgrst204" in msg or "schema cache" in msg:
            return db().table(table).insert(fallback).execute()
        raise


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _upsert_profile(user_id: str, email: str | None, username: str, full_name: str, role: str = "user"):
    row = {
        "id": user_id,
        "email": (email or "")[:200],
        "username": username,
        "full_name": full_name[:120],
        "role": role,
    }
    existing = profile_of(user_id)
    if existing:
        db().table("profiles").update(
            {"email": row["email"], "username": username, "full_name": row["full_name"]}
        ).eq("id", user_id).execute()
        return
    db().table("profiles").insert(row).execute()


def _username_taken(username: str, ignore_id: str | None = None) -> bool:
    res = db().table("profiles").select("id").ilike("username", username).limit(2).execute()
    rows = res.data or []
    return any(r.get("id") != ignore_id for r in rows)


def _listing(listing_id: str) -> dict:
    res = db().table("listings").select("*").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    return rows[0]


def _can_see_listing(item: dict, user) -> bool:
    if (item.get("status") or "active") == "active":
        return True
    if not user:
        return False
    if is_admin(user.id):
        return True
    return item.get("owner_id") == user.id


@app.get("/")
def root():
    return {"app": "Jengo API", "version": "1.0.0", "phase": 1}


@app.get("/health")
def health():
    return {"ok": True, "service": "jengo", "supabase": os.getenv("SUPABASE_URL", "")}


@app.post("/auth/register")
def register(request: Request, body: RegisterIn):
    limiter.check(f"register:{_client_key(request)}", 5)
    email = body.email.strip().lower()
    username = body.username.strip()
    full_name = body.full_name.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Barua pepe si sahihi")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Nenosiri liwe angalau herufi 8")
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="Username: herufi 3–20, herufi, namba au _")
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Jina linahitajika")
    if _username_taken(username):
        raise HTTPException(status_code=400, detail="Username imeshatumika")
    try:
        res = anon().auth.sign_up({"email": email, "password": body.password})
    except Exception as exc:
        msg = str(exc).lower()
        if "already" in msg or "registered" in msg:
            raise HTTPException(status_code=400, detail="Akaunti ipo. Ingia au thibitisha barua pepe.")
        raise HTTPException(status_code=400, detail="Imeshindikana kujisajili")
    user = getattr(res, "user", None)
    if not user:
        raise HTTPException(status_code=400, detail="Imeshindikana kujisajili")
    _upsert_profile(user.id, email, username, full_name)
    return {"ok": True, "email": email, "needs_verify": True}


@app.post("/auth/verify")
def verify(request: Request, body: VerifyIn):
    limiter.check(f"verify:{_client_key(request)}", 8)
    email = body.email.strip().lower()
    code = body.code.strip()
    if not email or not code:
        raise HTTPException(status_code=400, detail="Weka barua pepe na namba")
    try:
        res = anon().auth.verify_otp({"email": email, "token": code, "type": "signup"})
    except Exception:
        try:
            res = anon().auth.verify_otp({"email": email, "token": code, "type": "email"})
        except Exception:
            raise HTTPException(status_code=400, detail="Namba si sahihi")
    session = getattr(res, "session", None)
    user = getattr(res, "user", None)
    if not session or not user:
        raise HTTPException(status_code=400, detail="Namba si sahihi")
    return public_profile(user, session.access_token)


@app.post("/auth/resend")
def resend(request: Request, body: ResendIn):
    limiter.check(f"resend:{_client_key(request)}", 3)
    email = body.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Barua pepe inahitajika")
    try:
        anon().auth.resend({"type": "signup", "email": email})
    except Exception:
        raise HTTPException(status_code=400, detail="Imeshindikana kutuma namba")
    return {"ok": True}


@app.post("/auth/login")
def login(request: Request, body: LoginIn):
    limiter.check(f"login:{_client_key(request)}", 8)
    email = body.email.strip().lower()
    try:
        res = anon().auth.sign_in_with_password({"email": email, "password": body.password})
    except Exception as exc:
        msg = str(exc).lower()
        if "not confirmed" in msg or "email not confirmed" in msg:
            raise HTTPException(status_code=403, detail="Barua pepe haijathibitishwa")
        raise HTTPException(status_code=401, detail=LOGIN_ERROR)
    session = getattr(res, "session", None)
    user = getattr(res, "user", None)
    if not session or not user:
        raise HTTPException(status_code=401, detail=LOGIN_ERROR)
    confirmed = getattr(user, "email_confirmed_at", None)
    if confirmed is None and not getattr(user, "confirmed_at", None):
        raise HTTPException(status_code=403, detail="Barua pepe haijathibitishwa")
    return public_profile(user, session.access_token)


@app.get("/auth/google")
def google_start(redirect_to: str):
    try:
        res = anon().auth.sign_in_with_oauth(
            {"provider": "google", "options": {"redirect_to": redirect_to}}
        )
        url = getattr(res, "url", None)
        if not url:
            raise RuntimeError("no url")
        return {"url": url}
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Google haijaunganishwa. Weka Google provider kwenye Supabase Auth.",
        )


@app.post("/auth/session")
def auth_session(body: SessionIn):
    try:
        res = anon().auth.get_user(body.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Kipindi si sahihi")
    user = getattr(res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Kipindi si sahihi")
    p = profile_of(user.id)
    if not p:
        email = getattr(user, "email", "") or ""
        base = re.sub(r"[^A-Za-z0-9_]", "", (email.split("@")[0] or "user"))[:16] or "user"
        name = base
        n = 0
        while _username_taken(name):
            n += 1
            name = f"{base}{n}"[:20]
        meta = getattr(user, "user_metadata", None) or {}
        full = meta.get("full_name") or meta.get("name") or name
        _upsert_profile(user.id, email, name, str(full))
    return public_profile(user, body.access_token)


@app.get("/auth/me")
def me(user=Depends(current_user)):
    return public_profile(user)


@app.get("/listings")
def list_listings(
    request: Request,
    status: str = "active",
    category: str | None = None,
    q: str | None = None,
    sort: str = "new",
    mine: bool = False,
):
    user = None
    header = request.headers.get("authorization")
    if header:
        try:
            user = current_user(header)
        except HTTPException:
            user = None
    if mine:
        if not user:
            raise HTTPException(status_code=401, detail="Ingia kwanza")
        query = db().table("listings").select("*").eq("owner_id", user.id)
    else:
        if status and status != "active":
            if not user or not is_admin(user.id):
                raise HTTPException(status_code=403, detail="Admin tu")
        query = db().table("listings").select("*")
        if status:
            query = query.eq("status", status)
    if category:
        query = query.eq("category", category)
    if q:
        query = query.ilike("title", "%" + q + "%")
    column = "likes_count" if sort == "likes" else "created_at"
    res = query.order(column, desc=True).limit(100).execute()
    return {"items": [decorate_listing(x) for x in (res.data or [])]}


@app.get("/listings/{listing_id}")
def get_listing(request: Request, listing_id: str):
    item = _listing(listing_id)
    user = None
    header = request.headers.get("authorization")
    if header:
        try:
            user = current_user(header)
        except HTTPException:
            user = None
    if not _can_see_listing(item, user):
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    return decorate_listing(item)


@app.post("/listings")
def create_listing(body: ListingIn, user=Depends(current_user)):
    allowed = {"chumba_nyumba", "apartment_airbnb", "store_godown", "frame", "vifaa"}
    if body.category not in allowed:
        raise HTTPException(status_code=400, detail="Kategoria si sahihi")
    if len(body.title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Kichwa kifupi")
    unit = (body.unit or "").strip().lower() or None
    if unit and unit not in UNITS:
        raise HTTPException(status_code=400, detail="Kipimo si sahihi")
    if body.stock is not None and body.stock < 0:
        raise HTTPException(status_code=400, detail="Stock si sahihi")
    period = "" if body.category == "vifaa" else body.period
    if body.category == "vifaa":
        period = unit or ""
    desc = body.description.strip()[:2000]
    if body.category == "vifaa" and (unit or body.stock is not None):
        desc = with_meta(desc, {"unit": unit, "stock": body.stock})
    row = {
        "category": body.category,
        "title": body.title.strip()[:200],
        "description": desc,
        "price": body.price,
        "period": period,
        "location": body.location.strip()[:200],
        "city": (body.city or "Dar es Salaam").strip()[:80],
        "images": body.images[:6],
        "status": "pending",
        "verified": False,
        "likes_count": 0,
        "owner_id": user.id,
    }
    extras = dict(row)
    if body.category == "vifaa":
        if unit:
            extras["unit"] = unit
        if body.stock is not None:
            extras["stock"] = body.stock
    res = _save_row("listings", extras, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Imeshindwa kuhifadhi")
    return decorate_listing(res.data[0])


@app.patch("/listings/{listing_id}")
def set_listing_status(listing_id: str, body: ListingStatusIn, user=Depends(current_user)):
    require_admin(user)
    if body.status not in {"active", "hidden", "rejected"}:
        raise HTTPException(status_code=400, detail="Hali si sahihi")
    res = db().table("listings").update({"status": body.status}).eq("id", listing_id).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    return decorate_listing(rows[0])


@app.post("/listings/{listing_id}/like")
def like_listing(listing_id: str, body: LikeIn, user=Depends(current_user)):
    cur = db().table("listings").select("likes_count").eq("id", listing_id).limit(1).execute()
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    n = int(rows[0].get("likes_count") or 0) + (1 if body.on else -1)
    if n < 0:
        n = 0
    db().table("listings").update({"likes_count": n}).eq("id", listing_id).execute()
    return {"id": listing_id, "likes_count": n}


@app.post("/bookings")
def create_booking(body: BookingIn, user=Depends(current_user)):
    listing = decorate_listing(_listing(body.listing_id))
    if body.quantity is not None and body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Kiasi si sahihi")
    raw_stock = listing.get("stock")
    if raw_stock is not None and body.quantity is not None:
        try:
            stock = float(raw_stock)
        except (TypeError, ValueError):
            stock = None
        if stock is not None and body.quantity > stock:
            raise HTTPException(status_code=400, detail="Kiasi kinazidi stock")
    msg = (body.message or "")[:1000]
    if body.quantity is not None:
        msg = f"[[qty:{body.quantity}]] {msg}".strip()
    row = {
        "listing_id": body.listing_id,
        "message": msg,
        "status": "pending",
        "user_id": user.id,
    }
    extras = dict(row)
    if body.quantity is not None:
        extras["quantity"] = body.quantity
    res = _save_row("bookings", extras, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Ombi halijahifadhiwa")
    return _public_booking(res.data[0])


def _public_booking(row: dict) -> dict:
    item = dict(row)
    item["quantity"] = qty_from_booking(item)
    item.update(commission_from_booking(row))
    item["message"] = booking_message(item.get("message"))
    rev = review_from_booking(row)
    if rev:
        item["review"] = rev
    return item


@app.get("/bookings")
def list_bookings(
    listing_id: str | None = None,
    mine: str | None = None,
    user=Depends(current_user),
):
    query = db().table("bookings").select("*")
    if mine == "sent":
        query = query.eq("user_id", user.id)
    elif mine == "incoming":
        owned = db().table("listings").select("id").eq("owner_id", user.id).execute()
        ids = [x["id"] for x in (owned.data or [])]
        if not ids:
            return {"items": []}
        query = query.in_("listing_id", ids)
    elif listing_id:
        listing = _listing(listing_id)
        if listing.get("owner_id") != user.id and not is_admin(user.id):
            query = query.eq("listing_id", listing_id).eq("user_id", user.id)
        else:
            query = query.eq("listing_id", listing_id)
    else:
        query = query.eq("user_id", user.id)
    res = query.order("created_at", desc=True).limit(100).execute()
    return {"items": [_public_booking(x) for x in (res.data or [])]}


def _listing_price(listing_id: str | None) -> float | None:
    if not listing_id:
        return None
    res = db().table("listings").select("price").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        return None
    try:
        return float(rows[0].get("price"))
    except (TypeError, ValueError):
        return None


@app.patch("/bookings/{booking_id}")
def set_booking_status(booking_id: str, body: BookingStatusIn, user=Depends(current_user)):
    if body.status not in {"pending", "accepted", "rejected", "moved_in"}:
        raise HTTPException(status_code=400, detail="Hali si sahihi")
    cur = db().table("bookings").select("*").eq("id", booking_id).limit(1).execute()
    existing = (cur.data or [None])[0]
    if not existing:
        raise HTTPException(status_code=404, detail="Ombi halipo")
    listing = _listing(existing.get("listing_id"))
    if body.status in {"accepted", "rejected"}:
        if listing.get("owner_id") != user.id and not is_admin(user.id):
            raise HTTPException(status_code=403, detail="Si tangazo lako")
    elif body.status == "moved_in":
        if existing.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Si ombi lako")
        if existing.get("status") != "accepted":
            raise HTTPException(status_code=400, detail="Kubali ombi kwanza")
    payload: dict = {"status": body.status}
    if body.status == "moved_in":
        price = _listing_price(existing.get("listing_id"))
        if price is not None:
            payload["commission_amount"] = price * 0.10
        else:
            payload["commission_rate"] = 0.10
    try:
        res = db().table("bookings").update(payload).eq("id", booking_id).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "column" in msg or "pgrst204" in msg or "schema cache" in msg:
            fallback = {"status": body.status}
            if body.status == "moved_in":
                amount = payload.get("commission_amount")
                rate = payload.get("commission_rate", 0.10)
                marker = f"[[commission:{'' if amount is None else amount}:{rate}]]"
                old = existing.get("message") or ""
                if "[[commission:" not in old:
                    fallback["message"] = f"{old} {marker}".strip()
            res = db().table("bookings").update(fallback).eq("id", booking_id).execute()
        else:
            raise
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Ombi halipo")
    return _public_booking(rows[0])


@app.post("/reviews")
def create_review(body: ReviewIn, user=Depends(current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Alama 1 hadi 5")
    cur = db().table("bookings").select("*").eq("id", body.booking_id).limit(1).execute()
    booking = (cur.data or [None])[0]
    if not booking:
        raise HTTPException(status_code=404, detail="Ombi halipo")
    if booking.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Si ombi lako")
    if booking.get("status") != "moved_in":
        raise HTTPException(status_code=400, detail="Thibitisha kuhamia kwanza")
    if review_from_booking(booking):
        raise HTTPException(status_code=400, detail="Tayari umeweka tathmini")
    comment = (body.comment or "")[:500]
    row = {
        "booking_id": body.booking_id,
        "listing_id": booking.get("listing_id"),
        "user_id": user.id,
        "rating": body.rating,
        "comment": comment,
    }
    try:
        res = db().table("reviews").insert(row).execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
    marker = f"[[review:{body.rating}:{comment}]]"
    msg = (booking.get("message") or "").rstrip()
    db().table("bookings").update({"message": f"{msg} {marker}".strip()}).eq("id", body.booking_id).execute()
    return {"booking_id": body.booking_id, "rating": body.rating, "comment": comment}


@app.get("/reviews")
def list_reviews(listing_id: str | None = None, booking_id: str | None = None):
    try:
        query = db().table("reviews").select("*")
        if listing_id:
            query = query.eq("listing_id", listing_id)
        if booking_id:
            query = query.eq("booking_id", booking_id)
        res = query.order("created_at", desc=True).limit(50).execute()
        return {"items": res.data or []}
    except Exception:
        query = db().table("bookings").select("*")
        if listing_id:
            query = query.eq("listing_id", listing_id)
        if booking_id:
            query = query.eq("id", booking_id)
        res = query.limit(100).execute()
        items = []
        for row in res.data or []:
            rev = review_from_booking(row)
            if rev:
                items.append({**rev, "listing_id": row.get("listing_id"), "user_id": row.get("user_id")})
        return {"items": items}
