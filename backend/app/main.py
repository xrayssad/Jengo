from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from app.config import settings
from app.db import get_supabase
from app import schemas

app = FastAPI(title="Jengo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"app": "Jengo API", "version": "1.0.0", "phase": 1}

@app.get("/health")
def health():
    return {"ok": True, "service": "jengo", "supabase": settings.supabase_url}

@app.get("/listings")
def list_listings(
    category: Optional[str] = None,
    q: Optional[str] = None,
    status: str = "active",
    limit: int = 50,
):
    sb = get_supabase()
    try:
        query = (
            sb.table("listings")
            .select("*")
            .eq("status", status)
            .order("created_at", desc=True)
            .limit(min(limit, 100))
        )
        if category:
            query = query.eq("category", category)
        if q:
            query = query.or_(f"title.ilike.%{q}%,location.ilike.%{q}%")
        r = query.execute()
        return {"items": r.data or []}
    except Exception as e:
        return {"items": [], "error": str(e)}

@app.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    sb = get_supabase()
    try:
        r = sb.table("listings").select("*").eq("id", listing_id).single().execute()
        if not r.data:
            raise HTTPException(404, "Tangazo halipatikani")
        return r.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/listings")
def create_listing(body: schemas.ListingIn):
    allowed = {"chumba_nyumba", "apartment_airbnb", "store_godown", "frame"}
    if body.category not in allowed:
        raise HTTPException(400, "Kategoria si sahihi")
    sb = get_supabase()
    row = {
        "category": body.category,
        "title": body.title,
        "description": body.description or "",
        "price": float(body.price),
        "period": body.period,
        "location": body.location,
        "city": body.city or "Dar es Salaam",
        "status": "active",
        "verified": False,
        "images": body.images or [],
    }
    try:
        r = sb.table("listings").insert(row).execute()
        if not r.data:
            raise HTTPException(400, "Insert tupu")
        return r.data[0]
    except Exception as e:
        raise HTTPException(400, f"DB: {e}")
