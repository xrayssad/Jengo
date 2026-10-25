import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client

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


def db():
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_ANON_KEY"]
    return create_client(url, key)


UNITS = {"mfuko", "tani", "kipande", "dei"}
RENTAL_PERIODS = {"mwezi", "miezi_3", "miezi_6", "mwaka", "usiku", "siku", "wiki"}


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


@app.get("/")
def root():
    return {"app": "Jengo API", "version": "1.0.0", "phase": 1}


@app.get("/health")
def health():
    return {"ok": True, "service": "jengo", "supabase": os.getenv("SUPABASE_URL", "")}


@app.get("/listings")
def list_listings(status: str = "active", category: str | None = None, q: str | None = None, sort: str = "new"):
    query = db().table("listings").select("*")
    if status:
        query = query.eq("status", status)
    if category:
        query = query.eq("category", category)
    if q:
        query = query.ilike("title", "%" + q + "%")
    column = "likes_count" if sort == "likes" else "created_at"
    res = query.order(column, desc=True).limit(100).execute()
    return {"items": res.data or []}


@app.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    res = db().table("listings").select("*").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    return rows[0]


def _save_row(table: str, row: dict, fallback: dict):
    try:
        return db().table(table).insert(row).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "column" in msg or "pgrst204" in msg or "schema cache" in msg:
            return db().table(table).insert(fallback).execute()
        raise


@app.post("/listings")
def create_listing(body: ListingIn):
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
    if body.category == "vifaa" and period in RENTAL_PERIODS:
        period = ""
    row = {
        "category": body.category,
        "title": body.title.strip()[:200],
        "description": body.description.strip()[:2000],
        "price": body.price,
        "period": period,
        "location": body.location.strip()[:200],
        "city": (body.city or "Dar es Salaam").strip()[:80],
        "images": body.images[:6],
        "status": "pending",
        "verified": False,
        "likes_count": 0,
    }
    extras = dict(row)
    if body.category == "vifaa":
        if unit:
            extras["unit"] = unit
        if body.stock is not None:
            extras["stock"] = body.stock
    fallback = {**row, "period": unit} if body.category == "vifaa" and unit else row
    res = _save_row("listings", extras, fallback)
    if not res.data:
        raise HTTPException(status_code=400, detail="Imeshindwa kuhifadhi")
    return res.data[0]


class ListingStatusIn(BaseModel):
    status: str


@app.patch("/listings/{listing_id}")
def set_listing_status(listing_id: str, body: ListingStatusIn):
    if body.status not in {"active", "hidden", "rejected"}:
        raise HTTPException(status_code=400, detail="Hali si sahihi")
    res = db().table("listings").update({"status": body.status}).eq("id", listing_id).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
    return rows[0]


@app.post("/listings/{listing_id}/like")
def like_listing(listing_id: str, body: LikeIn):
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
def create_booking(body: BookingIn):
    listing_res = db().table("listings").select("*").eq("id", body.listing_id).limit(1).execute()
    listing = (listing_res.data or [None])[0]
    if not listing:
        raise HTTPException(status_code=404, detail="Tangazo halipo")
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
    row = {"listing_id": body.listing_id, "message": (body.message or "")[:1000], "status": "pending"}
    extras = dict(row)
    if body.quantity is not None:
        extras["quantity"] = body.quantity
    res = _save_row("bookings", extras, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Ombi halijahifadhiwa")
    return res.data[0]


@app.get("/bookings")
def list_bookings(listing_id: str | None = None):
    query = db().table("bookings").select("*")
    if listing_id:
        query = query.eq("listing_id", listing_id)
    res = query.order("created_at", desc=True).limit(100).execute()
    return {"items": res.data or []}


class BookingStatusIn(BaseModel):
    status: str


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
def set_booking_status(booking_id: str, body: BookingStatusIn):
    if body.status not in {"pending", "accepted", "rejected", "moved_in"}:
        raise HTTPException(status_code=400, detail="Hali si sahihi")
    cur = db().table("bookings").select("*").eq("id", booking_id).limit(1).execute()
    existing = (cur.data or [None])[0]
    if not existing:
        raise HTTPException(status_code=404, detail="Ombi halipo")
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
            res = db().table("bookings").update({"status": body.status}).eq("id", booking_id).execute()
        else:
            raise
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Ombi halipo")
    return rows[0]
