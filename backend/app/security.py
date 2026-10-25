import json
import os
import re
import time
from collections import defaultdict

from fastapi import Header, HTTPException
from supabase import create_client

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,20}$")
META_RE = re.compile(r"\n*<!--jengo:(.*?)-->\s*$", re.S)
QTY_RE = re.compile(r"^\[\[qty:([0-9.]+)\]\]\s*")
REVIEW_RE = re.compile(r"\[\[review:(\d+):(.*?)\]\]\s*$", re.S)
COMMISSION_RE = re.compile(r"\[\[commission:([^:\]]*):([^:\]]*)\]\]")

LOGIN_ERROR = "Barua pepe au nenosiri si sahihi"


def load_env():
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    service = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return url, anon, service


def db():
    url, _, service = load_env()
    return create_client(url, service)


def anon():
    url, key, _ = load_env()
    return create_client(url, key)


def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Ingia kwanza")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Ingia kwanza")
    try:
        res = anon().auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Kipindi kimeisha")
    user = getattr(res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Kipindi kimeisha")
    return user


def profile_of(user_id: str) -> dict | None:
    res = db().table("profiles").select("*").eq("id", user_id).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def profile_role(profile: dict | None) -> str:
    raw = str((profile or {}).get("role") or "").strip().lower()
    if raw == "admin" or (profile or {}).get("is_admin") is True:
        return "admin"
    return "user"


def is_admin_profile(profile: dict | None) -> bool:
    return profile_role(profile) == "admin"


def is_admin(user_id: str) -> bool:
    return is_admin_profile(profile_of(user_id))


def require_admin(user):
    if not is_admin(user.id):
        raise HTTPException(status_code=403, detail="Admin tu")
    return user


def needs_username(profile: dict | None) -> bool:
    name = str((profile or {}).get("username") or "").strip()
    return not bool(USERNAME_RE.match(name))


def public_profile(user, token: str | None = None) -> dict:
    p = profile_of(user.id) or {}
    role = profile_role(p)
    out = {
        "user_id": user.id,
        "email": getattr(user, "email", None) or p.get("email"),
        "username": p.get("username"),
        "full_name": p.get("full_name"),
        "role": role,
        "is_admin": role == "admin",
        "needs_username": needs_username(p),
    }
    if token:
        out["access_token"] = token
    return out


def split_desc(desc: str | None) -> tuple[str, dict]:
    text = desc or ""
    m = META_RE.search(text)
    if not m:
        return text, {}
    try:
        meta = json.loads(m.group(1))
        if not isinstance(meta, dict):
            meta = {}
    except Exception:
        meta = {}
    return text[: m.start()].rstrip(), meta


def with_meta(desc: str | None, extra: dict) -> str:
    clean, meta = split_desc(desc)
    meta.update({k: v for k, v in extra.items() if v is not None})
    if not meta:
        return clean
    return f"{clean}\n\n<!--jengo:{json.dumps(meta, separators=(',', ':'))}-->"


def decorate_listing(row: dict | None) -> dict | None:
    if not row:
        return row
    item = dict(row)
    clean, meta = split_desc(item.get("description"))
    item["description"] = clean
    if not item.get("unit") and meta.get("unit"):
        item["unit"] = meta.get("unit")
    if item.get("stock") is None and meta.get("stock") is not None:
        item["stock"] = meta.get("stock")
    if item.get("category") == "vifaa" and not item.get("unit") and item.get("period"):
        item["unit"] = item.get("period")
    return item


def qty_from_booking(row: dict) -> float | None:
    if row.get("quantity") is not None:
        try:
            return float(row["quantity"])
        except (TypeError, ValueError):
            pass
    m = QTY_RE.match(row.get("message") or "")
    return float(m.group(1)) if m else None


def booking_message(raw: str | None) -> str:
    text = QTY_RE.sub("", raw or "")
    text = REVIEW_RE.sub("", text)
    text = COMMISSION_RE.sub("", text)
    return text.strip()


def review_from_booking(row: dict) -> dict | None:
    m = REVIEW_RE.search(row.get("message") or "")
    if not m:
        return None
    return {"rating": int(m.group(1)), "comment": m.group(2), "booking_id": row.get("id")}


def commission_from_booking(row: dict) -> dict:
    out = {
        "commission_amount": row.get("commission_amount"),
        "commission_rate": row.get("commission_rate"),
    }
    m = COMMISSION_RE.search(row.get("message") or "")
    if not m:
        return out
    if out["commission_amount"] is None and m.group(1):
        try:
            out["commission_amount"] = float(m.group(1))
        except ValueError:
            pass
    if out["commission_rate"] is None and m.group(2):
        try:
            out["commission_rate"] = float(m.group(2))
        except ValueError:
            pass
    return out


class RateGate:
    def __init__(self):
        self.hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window: int = 60, detail: str = "Jaribu tena baadaye"):
        now = time.time()
        bucket = [t for t in self.hits[key] if now - t < window]
        if len(bucket) >= limit:
            raise HTTPException(status_code=429, detail=detail)
        bucket.append(now)
        self.hits[key] = bucket

    def touch(self, key: str):
        self.hits[key].append(time.time())


limiter = RateGate()
