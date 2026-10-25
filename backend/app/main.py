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


class ListingIn(BaseModel):
    category: str
    title: str
    description: str = ""
    price: float
    period: str
    location: str
    city: str = "Dar es Salaam"
    images: list[str] = Field(default_factory=list)


class BookingIn(BaseModel):
    listing_id: str
    message: str = ""


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


@app.post("/listings")
def create_listing(body: ListingIn):
    allowed = {"chumba_nyumba", "apartment_airbnb", "store_godown", "frame"}
    if body.category not in allowed:
        raise HTTPException(status_code=400, detail="Kategoria si sahihi")
    if len(body.title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Kichwa kifupi")
    row = {
        "category": body.category,
        "title": body.title.strip()[:200],
        "description": body.description.strip()[:2000],
        "price": body.price,
        "period": body.period,
        "location": body.location.strip()[:200],
        "city": (body.city or "Dar es Salaam").strip()[:80],
        "images": body.images[:6],
        "status": "active",
        "verified": False,
        "likes_count": 0,
    }
    res = db().table("listings").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Imeshindwa kuhifadhi")
    return res.data[0]


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
    row = {"listing_id": body.listing_id, "message": (body.message or "")[:1000], "status": "pending"}
    res = db().table("bookings").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Ombi halijahifadhiwa")
    return res.data[0]
