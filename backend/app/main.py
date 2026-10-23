from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Optional
from app.config import settings
from app.db import get_supabase
from app import schemas

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="Jengo API", version="1.0.1")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.get("/")
@limiter.limit("60/minute")
def root(request: Request):
    return {"app": "Jengo API", "version": "1.0.1", "phase": 1}

@app.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    return {"ok": True, "service": "jengo", "supabase": settings.supabase_url}

@app.get("/listings")
@limiter.limit("60/minute")
def list_listings(
    request: Request,
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
@limiter.limit("60/minute")
def get_listing(request: Request, listing_id: str):
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
@limiter.limit("20/minute")
def create_listing(request: Request, body: schemas.ListingIn):
    """20 POST/min kwa IP — kupunguza spam kabla ya auth."""
    allowed = {"chumba_nyumba", "apartment_airbnb", "store_godown", "frame"}
    if body.category not in allowed:
        raise HTTPException(400, "Kategoria si sahihi")
    if len(body.title.strip()) < 3:
        raise HTTPException(400, "Kichwa kifupi mno")
    if body.price < 0 or body.price > 1_000_000_000:
        raise HTTPException(400, "Bei si sahihi")

    sb = get_supabase()
    row = {
        "category": body.category,
        "title": body.title.strip()[:200],
        "description": (body.description or "")[:5000],
        "price": float(body.price),
        "period": body.period,
        "location": body.location.strip()[:200],
        "city": (body.city or "Dar es Salaam")[:100],
        "status": "active",
        "verified": False,
        "images": body.images or [],
    }
    try:
        r = sb.table("listings").insert(row).execute()
        if not r.data:
            raise HTTPException(400, "Insert tupu")
        return r.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"DB: {e}")

@app.post("/bookings")
@limiter.limit("30/minute")
def create_booking(request: Request, body: schemas.BookingIn):
    """Awamu 2 — tuma ombi."""
    sb = get_supabase()
    try:
        # Hakikisha listing ipo
        listing = (
            sb.table("listings")
            .select("id")
            .eq("id", body.listing_id)
            .single()
            .execute()
        )
        if not listing.data:
            raise HTTPException(404, "Tangazo halipatikani")
        r = sb.table("bookings").insert({
            "listing_id": body.listing_id,
            "user_id": None,
            "message": (body.message or "")[:2000],
            "status": "pending",
        }).execute()
        return r.data[0] if r.data else {}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))
