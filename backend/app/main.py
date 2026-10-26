import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import mqtt_bus, phone_auth, places, social
from app.uploads import save_listing_photo
from app.security import (
    LOGIN_ERROR,
    USERNAME_RE,
    account_status,
    anon,
    assert_active_account,
    booking_message,
    commission_from_booking,
    current_user,
    db,
    decorate_listing,
    is_admin,
    limiter,
    needs_username,
    profile_of,
    profile_role,
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
    city: str = ""
    images: list[str] = Field(default_factory=list)
    unit: str | None = None
    stock: float | None = None
    lat: float | None = None
    lng: float | None = None
    phones: list[str] = Field(default_factory=list)
    phone: str = ""


class BookingIn(BaseModel):
    listing_id: str
    message: str = ""
    quantity: float | None = None


class LikeIn(BaseModel):
    on: bool = True


class ListingStatusIn(BaseModel):
    status: str


class UserStatusIn(BaseModel):
    status: str


class BookingStatusIn(BaseModel):
    status: str


class RegisterIn(BaseModel):
    email: str = ""
    phone: str = ""
    password: str
    username: str
    full_name: str
    redirect_to: str = ""


class LoginIn(BaseModel):
    email: str = ""
    phone: str = ""
    password: str


class VerifyIn(BaseModel):
    email: str = ""
    phone: str = ""
    code: str


class ResendIn(BaseModel):
    email: str = ""
    phone: str = ""
    redirect_to: str = ""


class SessionIn(BaseModel):
    access_token: str


class ConfirmIn(BaseModel):
    token_hash: str
    type: str = "signup"


class UsernameIn(BaseModel):
    username: str
    full_name: str = ""


class ReviewIn(BaseModel):
    booking_id: str
    rating: int
    comment: str = ""


class MessageIn(BaseModel):
    body: str
    peer_id: str = ""


class CommentIn(BaseModel):
    body: str
    parent_id: str = ""


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


def _safe_redirect(raw: str | None) -> str:
    fallback = (os.getenv("FRONTEND_URL") or "").strip().rstrip("/")
    if not fallback:
        first = (os.getenv("CORS_ORIGINS") or "http://localhost:3000").split(",")[0].strip()
        fallback = first.rstrip("/")
    dest = (raw or "").strip()
    if not dest:
        dest = f"{fallback}/auth/callback"
    allowed = {o.strip().rstrip("/") for o in (os.getenv("CORS_ORIGINS") or "").split(",") if o.strip()}
    if fallback:
        allowed.add(fallback)
    allowed.add("http://localhost:3000")
    allowed.add("http://127.0.0.1:3000")
    origin = dest.split("/auth/")[0].rstrip("/") if "/auth/" in dest else dest.rstrip("/")
    if allowed and origin not in allowed and not origin.endswith(".vercel.app"):
        dest = f"{fallback}/auth/callback"
    if dest.endswith("/auth/callback"):
        return dest
    return f"{origin}/auth/callback"


def _signup_options(redirect_to: str | None) -> dict:
    return {"email_redirect_to": _safe_redirect(redirect_to)}


OTP_RE = re.compile(rf"^\d{{{phone_auth.OTP_LEN}}}$")
PHONE_KEEP_RE = re.compile(r"[^\d+]")


def _clean_phones(*groups) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for group in groups:
        items = group if isinstance(group, list) else [group]
        for raw in items:
            s = PHONE_KEEP_RE.sub("", str(raw or "").strip())
            digits = re.sub(r"\D", "", s)
            if len(digits) < 9 or len(digits) > 15:
                continue
            key = digits[-9:]
            if key in seen:
                continue
            seen.add(key)
            out.append(s[:20])
            if len(out) >= 3:
                return out
    return out


def _user_meta(user) -> dict:
    meta = getattr(user, "user_metadata", None) or {}
    return meta if isinstance(meta, dict) else {}


def _get_auth_user(user_id: str):
    try:
        res = db().auth.admin.get_user_by_id(user_id)
    except Exception:
        return None
    return getattr(res, "user", None) or res


def _drop_profile(user_id: str):
    try:
        db().table("profiles").delete().eq("id", user_id).execute()
    except Exception:
        pass


def _session_from_verify(res):
    session = getattr(res, "session", None)
    user = getattr(res, "user", None)
    if not session or not user:
        raise HTTPException(status_code=400, detail="Verification failed")
    _finish_signup_profile(user)
    assert_active_account(user)
    return public_profile(user, session.access_token)


def _upsert_profile(user_id: str, email: str | None, username: str, full_name: str, role: str = "user", phone: str = ""):
    row = {
        "id": user_id,
        "email": (email or "")[:200],
        "username": username,
        "full_name": full_name[:120],
        "role": "user",
    }
    if phone:
        row["phone"] = phone
    existing = profile_of(user_id)
    patch = {"email": row["email"], "username": username, "full_name": row["full_name"]}
    if phone:
        patch["phone"] = phone
    if existing:
        try:
            db().table("profiles").update(patch).eq("id", user_id).execute()
        except Exception:
            patch.pop("phone", None)
            db().table("profiles").update(patch).eq("id", user_id).execute()
        return
    try:
        db().table("profiles").insert(row).execute()
    except Exception:
        row.pop("phone", None)
        db().table("profiles").insert(row).execute()


def _username_taken(username: str, ignore_id: str | None = None) -> bool:
    res = db().table("profiles").select("id").ilike("username", username).limit(5).execute()
    for row in res.data or []:
        uid = row.get("id")
        if uid == ignore_id:
            continue
        auth_user = _get_auth_user(uid) if uid else None
        if auth_user and not _account_confirmed(auth_user):
            continue
        if not auth_user:
            continue
        return True
    return False


def _release_unverified_username(username: str, keep_id: str | None = None):
    res = db().table("profiles").select("id").ilike("username", username).execute()
    for row in res.data or []:
        uid = row.get("id")
        if not uid or uid == keep_id:
            continue
        auth_user = _get_auth_user(uid)
        if auth_user and _account_confirmed(auth_user):
            continue
        _drop_profile(uid)


def _finish_signup_profile(user):
    existing = profile_of(user.id)
    if existing and not needs_username(existing):
        return
    meta = _user_meta(user)
    email = getattr(user, "email", None)
    phone = phone_auth.as_e164(getattr(user, "phone", None) or meta.get("phone") or (existing or {}).get("phone"))
    username = str(meta.get("username") or (existing or {}).get("username") or "").strip()
    full_name = str(
        meta.get("full_name") or meta.get("name") or (existing or {}).get("full_name") or ""
    ).strip()[:120]
    if username and USERNAME_RE.match(username):
        _release_unverified_username(username, user.id)
        if _username_taken(username, user.id):
            username = ""
    if username and USERNAME_RE.match(username):
        _upsert_profile(user.id, email, username, full_name or username, phone=phone)
        return
    if existing:
        return
    row = {
        "id": user.id,
        "email": (email or "")[:200],
        "full_name": full_name,
        "role": "user",
    }
    if phone:
        row["phone"] = phone
    try:
        db().table("profiles").insert(row).execute()
    except Exception:
        row.pop("phone", None)
        try:
            db().table("profiles").insert(row).execute()
        except Exception:
            pass


def _continue_unconfirmed_signup(user, email: str, password: str, username: str, full_name: str, phone: str = ""):
    payload = {
        "password": password,
        "user_metadata": {"username": username, "full_name": full_name, "phone": phone},
    }
    if phone:
        payload["phone"] = phone
    try:
        db().auth.admin.update_user_by_id(user.id, payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not create the account")
    _drop_profile(user.id)
    if phone and not email:
        _confirm_phone_user(user.id, phone)
        return
    if not email or not _issue_otp(user.id, email):
        raise HTTPException(status_code=400, detail="Could not send the 8-digit code to your email")
    limiter.touch(f"resend-otp:{email}")


def _auth_user_by_email(email: str):
    target = (email or "").strip().lower()
    if not target:
        return None

    def _match(listed):
        users = listed.users if hasattr(listed, "users") else listed
        for user in users or []:
            if str(getattr(user, "email", "") or "").strip().lower() == target:
                return user
        return None

    try:
        found = _match(db().auth.admin.list_users())
        if found:
            return found
    except Exception:
        pass
    try:
        page = 1
        while page < 10:
            listed = db().auth.admin.list_users(page=page, per_page=200)
            found = _match(listed)
            if found:
                return found
            users = listed.users if hasattr(listed, "users") else listed
            if len(list(users or [])) < 200:
                break
            page += 1
    except Exception:
        return None
    return None


def _auth_providers(user) -> list[str]:
    meta = getattr(user, "app_metadata", None) or {}
    if not isinstance(meta, dict):
        return []
    raw = meta.get("providers") or meta.get("provider") or []
    if isinstance(raw, str):
        return [raw.lower()]
    return [str(p).lower() for p in raw]


def _account_confirmed(user) -> bool:
    return bool(
        getattr(user, "email_confirmed_at", None)
        or getattr(user, "phone_confirmed_at", None)
        or getattr(user, "confirmed_at", None)
    )


def _user_phone(user) -> str:
    return phone_auth.as_e164(getattr(user, "phone", None) or _user_meta(user).get("phone"))


def _auth_user_by_phone(phone: str):
    target = phone_auth.as_e164(phone)
    if not target:
        return None

    def _match(listed):
        users = listed.users if hasattr(listed, "users") else listed
        for user in users or []:
            if _user_phone(user) == target:
                return user
        return None

    try:
        found = _match(db().auth.admin.list_users())
        if found:
            return found
    except Exception:
        pass
    try:
        page = 1
        while page < 10:
            listed = db().auth.admin.list_users(page=page, per_page=200)
            found = _match(listed)
            if found:
                return found
            users = listed.users if hasattr(listed, "users") else listed
            if len(list(users or [])) < 200:
                break
            page += 1
    except Exception:
        return None
    return None


def _find_account(email: str = "", phone: str = ""):
    kind, ident = phone_auth.parse_ident(phone, email)
    if kind == "phone":
        return _auth_user_by_phone(ident) or _auth_user_by_email(ident)
    if kind == "email":
        return _auth_user_by_email(ident)
    return None


def _issue_otp(user_id: str, email: str) -> bool:
    code = phone_auth.make_code()
    if len(code) != phone_auth.OTP_LEN or not code.isdigit() or "@" not in email:
        return False
    try:
        user = _get_auth_user(user_id)
        meta = phone_auth.stamp_otp(_user_meta(user), code)
        db().auth.admin.update_user_by_id(user_id, {"user_metadata": meta})
    except Exception:
        return False
    return phone_auth.send_email(email, code)


def _phone_placeholder_email(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    return f"{digits}@simu.jengo.app"


def _confirm_phone_user(user_id: str, phone: str):
    email = _phone_placeholder_email(phone)
    payload = {
        "email": email,
        "email_confirm": True,
        "phone_confirm": True,
        "user_metadata": phone_auth.clear_otp(_user_meta(_get_auth_user(user_id))),
    }
    try:
        payload["phone"] = phone
        db().auth.admin.update_user_by_id(user_id, payload)
    except Exception:
        payload.pop("phone", None)
        db().auth.admin.update_user_by_id(user_id, payload)


def _password_session(password: str, email: str = "", phone: str = ""):
    attempts = []
    if phone:
        attempts.append({"password": password, "phone": phone})
        attempts.append({"password": password, "email": _phone_placeholder_email(phone)})
    if email:
        attempts.append({"password": password, "email": email})
    last = None
    for creds in attempts:
        try:
            res = anon().auth.sign_in_with_password(creds)
        except Exception as exc:
            last = exc
            continue
        session = getattr(res, "session", None)
        user = getattr(res, "user", None)
        if session and user:
            if not _account_confirmed(user):
                raise HTTPException(status_code=403, detail="Account not verified")
            _finish_signup_profile(user)
            assert_active_account(user)
            return public_profile(user, session.access_token)
    msg = str(last or "").lower()
    if "not confirmed" in msg or "email not confirmed" in msg or "phone not confirmed" in msg:
        raise HTTPException(status_code=403, detail="Account not verified")
    raise HTTPException(status_code=401, detail=LOGIN_ERROR)


def _session_after_otp(user):
    phone = _user_phone(user)
    real_email = str(getattr(user, "email", None) or "").strip()
    if real_email.endswith("@simu.jengo.app"):
        real_email = ""
    mint = f"{str(user.id).replace('-', '')}@simu.jengo.app"
    patch = {
        "email": mint,
        "email_confirm": True,
        "user_metadata": phone_auth.clear_otp(_user_meta(user)),
    }
    if phone:
        patch["phone"] = phone
        patch["phone_confirm"] = True
    db().auth.admin.update_user_by_id(user.id, patch)
    link = db().auth.admin.generate_link({"type": "magiclink", "email": mint})
    props = getattr(link, "properties", None) or link
    token_hash = getattr(props, "hashed_token", None)
    if not token_hash and isinstance(props, dict):
        token_hash = props.get("hashed_token")
    if not token_hash:
        raise HTTPException(status_code=400, detail="Verification failed")
    res = anon().auth.verify_otp({"token_hash": token_hash, "type": "magiclink"})
    restore = {}
    if real_email:
        restore = {"email": real_email, "email_confirm": True}
    elif phone:
        restore = {"email": _phone_placeholder_email(phone), "email_confirm": True}
    if restore:
        try:
            db().auth.admin.update_user_by_id(user.id, restore)
        except Exception:
            pass
    session = getattr(res, "session", None)
    if not session:
        raise HTTPException(status_code=400, detail="Verification failed")
    fresh = _get_auth_user(user.id) or getattr(res, "user", None)
    if not fresh:
        raise HTTPException(status_code=400, detail="Verification failed")
    _finish_signup_profile(fresh)
    assert_active_account(fresh)
    return public_profile(fresh, session.access_token)


def _existing_account_detail(user) -> str:
    if "google" in _auth_providers(user):
        return "This account uses Google. Log in with Google. No OTP needed."
    if _account_confirmed(user):
        return "Account exists. Log in with phone or email and password."
    return "Account exists. Verify the code in your email, or log in."


def _listing(listing_id: str) -> dict:
    res = db().table("listings").select("*").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
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
    kind, ident = phone_auth.parse_ident(body.phone, body.email)
    username = body.username.strip()
    full_name = body.full_name.strip()
    if kind not in {"email", "phone"}:
        raise HTTPException(status_code=400, detail="Enter a phone number or email")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="Username: 3–20 characters, letters, numbers or _")
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Name is required")
    if _username_taken(username):
        raise HTTPException(status_code=400, detail="Username is already taken")
    email = ident if kind == "email" else ""
    phone = ident if kind == "phone" else ""
    existing = _find_account(email, phone)
    if existing:
        if _account_confirmed(existing) or "google" in _auth_providers(existing):
            raise HTTPException(status_code=400, detail=_existing_account_detail(existing))
        _continue_unconfirmed_signup(existing, email, body.password, username, full_name, phone)
        if phone:
            return _password_session(body.password, phone=phone)
        return {"ok": True, "email": email, "needs_verify": True}
    if phone:
        return _register_phone(phone, body.password, username, full_name)
    return _register_email(email, body.password, username, full_name)


def _register_email(email: str, password: str, username: str, full_name: str):
    meta = {"username": username, "full_name": full_name}
    try:
        created = db().auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": False,
                "user_metadata": meta,
            }
        )
        user = getattr(created, "user", None) or created
    except Exception as exc:
        msg = str(exc).lower()
        if "already" in msg or "registered" in msg or "exists" in msg:
            again = _auth_user_by_email(email)
            if again and not _account_confirmed(again) and "google" not in _auth_providers(again):
                _continue_unconfirmed_signup(again, email, password, username, full_name)
                return {"ok": True, "email": email, "needs_verify": True}
            raise HTTPException(status_code=400, detail="Account exists. Log in or verify the code.")
        raise HTTPException(status_code=400, detail="Could not create the account") from exc
    if not user:
        raise HTTPException(status_code=400, detail="Could not create the account")
    if not _issue_otp(user.id, email):
        raise HTTPException(status_code=400, detail="Could not send the 8-digit code to your email")
    limiter.touch(f"resend-otp:{email}")
    return {"ok": True, "email": email, "needs_verify": True}


def _register_phone(phone: str, password: str, username: str, full_name: str):
    meta = {"username": username, "full_name": full_name, "phone": phone}
    try:
        created = db().auth.admin.create_user(
            {
                "phone": phone,
                "email": _phone_placeholder_email(phone),
                "password": password,
                "phone_confirm": True,
                "email_confirm": True,
                "user_metadata": meta,
            }
        )
        user = getattr(created, "user", None) or created
    except Exception as exc:
        msg = str(exc).lower()
        if "already" in msg or "registered" in msg or "exists" in msg:
            again = _auth_user_by_phone(phone)
            if again and not _account_confirmed(again):
                _continue_unconfirmed_signup(again, "", password, username, full_name, phone)
                return _password_session(password, phone=phone)
            raise HTTPException(status_code=400, detail="Account exists. Log in with phone and password.")
        try:
            created = db().auth.admin.create_user(
                {
                    "email": _phone_placeholder_email(phone),
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": meta,
                }
            )
            user = getattr(created, "user", None) or created
        except Exception:
            raise HTTPException(status_code=400, detail="Could not create the phone account") from exc
    if not user:
        raise HTTPException(status_code=400, detail="Could not create the phone account")
    _confirm_phone_user(user.id, phone)
    try:
        out = _password_session(password, phone=phone)
        out["ok"] = True
        out["phone"] = phone
        out["needs_verify"] = False
        return out
    except HTTPException:
        return {"ok": True, "phone": phone, "needs_verify": False}


@app.post("/auth/verify")
def verify(request: Request, body: VerifyIn):
    limiter.check(f"verify:{_client_key(request)}", 8)
    kind, ident = phone_auth.parse_ident(body.email)
    code = body.code.strip()
    if not OTP_RE.fullmatch(code):
        raise HTTPException(status_code=400, detail="Enter the 8-digit code we sent")
    if kind != "email":
        raise HTTPException(status_code=400, detail="Enter your email")
    user = _find_account(ident)
    fresh = _get_auth_user(user.id) if user else None
    if fresh and phone_auth.otp_ok(_user_meta(fresh), code):
        return _session_after_otp(fresh)
    raise HTTPException(status_code=400, detail="Code is incorrect")


@app.post("/auth/confirm")
def confirm_email_link(request: Request, body: ConfirmIn):
    limiter.check(f"confirm:{_client_key(request)}", 8)
    token_hash = body.token_hash.strip()
    kind = (body.type or "signup").strip() or "signup"
    if not token_hash:
        raise HTTPException(status_code=400, detail="Link is invalid")
    last = None
    for otp_type in (kind, "signup", "email", "magiclink"):
        try:
            res = anon().auth.verify_otp({"token_hash": token_hash, "type": otp_type})
            return _session_from_verify(res)
        except HTTPException:
            raise
        except Exception as exc:
            last = exc
            continue
    raise HTTPException(status_code=400, detail="Link expired or is invalid") from last


@app.post("/auth/resend")
def resend(request: Request, body: ResendIn):
    limiter.check(f"resend:{_client_key(request)}", 5)
    kind, ident = phone_auth.parse_ident(body.email)
    if kind != "email":
        raise HTTPException(status_code=400, detail="Enter your email")
    existing = _find_account(ident)
    if existing and _account_confirmed(existing):
        raise HTTPException(status_code=400, detail=_existing_account_detail(existing))
    limiter.check(
        f"resend-otp:{ident}",
        1,
        60,
        "Wait 60 seconds, then resend the code",
    )
    user = existing or _auth_user_by_email(ident)
    if not user or not _issue_otp(user.id, ident):
        raise HTTPException(status_code=400, detail="Could not send the 8-digit code to your email")
    return {"ok": True}


@app.post("/auth/login")
def login(request: Request, body: LoginIn):
    limiter.check(f"login:{_client_key(request)}", 8)
    kind, ident = phone_auth.parse_ident(body.phone, body.email)
    if kind == "phone":
        return _password_session(body.password, phone=ident)
    if kind != "email":
        raise HTTPException(status_code=401, detail=LOGIN_ERROR)
    return _password_session(body.password, email=ident)


GOOGLE_OFF = "Google is not connected in Supabase. Turn on the Google provider, or log in with email."


@app.get("/auth/google")
def google_start(redirect_to: str):
    dest = _safe_redirect(redirect_to)
    try:
        res = anon().auth.sign_in_with_oauth(
            {"provider": "google", "options": {"redirect_to": dest}}
        )
        url = getattr(res, "url", None)
        if not url:
            raise RuntimeError("no url")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail=GOOGLE_OFF)
    try:
        import httpx

        probe = httpx.get(url, follow_redirects=False, timeout=15)
        body = (probe.text or "").lower()
        if probe.status_code >= 400 or "provider is not enabled" in body or "unsupported provider" in body:
            raise HTTPException(status_code=400, detail=GOOGLE_OFF)
    except HTTPException:
        raise
    except Exception:
        pass
    return {"url": url}


@app.post("/auth/session")
def auth_session(body: SessionIn):
    try:
        res = anon().auth.get_user(body.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = getattr(res, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    _finish_signup_profile(user)
    assert_active_account(user)
    return public_profile(user, body.access_token)


@app.get("/auth/me")
def me(user=Depends(current_user)):
    return public_profile(user)


@app.post("/auth/username")
def set_username(request: Request, body: UsernameIn, user=Depends(current_user)):
    username = body.username.strip()
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="Username: 3–20 characters, letters, numbers or _")
    if _username_taken(username, user.id):
        raise HTTPException(status_code=400, detail="Username is already taken")
    p = profile_of(user.id)
    header = request.headers.get("authorization") or ""
    token = header.split(" ", 1)[1].strip() if header.lower().startswith("bearer ") else None
    if p and not needs_username(p):
        return public_profile(user, token)
    full = (body.full_name or "").strip() or (p or {}).get("full_name") or username
    email = getattr(user, "email", None)
    _upsert_profile(user.id, email, username, str(full)[:120])
    return public_profile(user, token)


def _table_count(table: str) -> int:
    try:
        res = db().table(table).select("id", count="exact").limit(1).execute()
        if getattr(res, "count", None) is not None:
            return int(res.count)
    except Exception:
        pass
    res = db().table(table).select("id").limit(1000).execute()
    return len(res.data or [])


def _recorded_commission(rows: list[dict]) -> float:
    total = 0.0
    for row in rows:
        amt = commission_from_booking(row).get("commission_amount")
        if amt is None:
            continue
        try:
            total += float(amt)
        except (TypeError, ValueError):
            continue
    return total


def _admin_user_row(row: dict, user=None) -> dict:
    return {
        "id": row.get("id"),
        "username": row.get("username"),
        "email": row.get("email"),
        "role": profile_role(row),
        "status": account_status(row, user),
        "full_name": row.get("full_name"),
    }


def _auth_status_map() -> dict[str, str]:
    out: dict[str, str] = {}
    try:
        listed = db().auth.admin.list_users()
        users = listed.users if hasattr(listed, "users") else listed
        for item in users or []:
            if str(_user_meta(item).get("account_status") or "").strip().lower() == "suspended":
                uid = getattr(item, "id", None)
                if uid:
                    out[str(uid)] = "suspended"
    except Exception:
        pass
    return out


def _profiles_for_admin() -> list[dict]:
    try:
        res = (
            db()
            .table("profiles")
            .select("id,username,email,role,status,full_name,created_at")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        return res.data or []
    except Exception:
        res = (
            db()
            .table("profiles")
            .select("id,username,email,role,full_name,created_at")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        return res.data or []


def _set_account_status(user_id: str, status: str):
    auth_user = _get_auth_user(user_id)
    meta = dict(_user_meta(auth_user) if auth_user else {})
    meta["account_status"] = status
    try:
        db().auth.admin.update_user_by_id(user_id, {"user_metadata": meta})
    except Exception:
        pass
    try:
        db().table("profiles").update({"status": status}).eq("id", user_id).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "column" not in msg and "pgrst204" not in msg and "schema cache" not in msg:
            raise


@app.get("/admin/stats")
def admin_stats(user=Depends(current_user)):
    require_admin(user)
    bookings = db().table("bookings").select("*").limit(500).execute()
    rows = bookings.data or []
    return {
        "users": _table_count("profiles"),
        "listings": _table_count("listings"),
        "bookings": _table_count("bookings"),
        "commission": _recorded_commission(rows),
    }


@app.get("/admin/users")
def admin_users(user=Depends(current_user)):
    require_admin(user)
    flags = _auth_status_map()
    items = []
    for row in _profiles_for_admin():
        if flags.get(str(row.get("id") or "")) == "suspended" and not row.get("status"):
            row = dict(row)
            row["status"] = "suspended"
        items.append(_admin_user_row(row))
    return {"items": items}


@app.get("/admin/listings")
def admin_listings(user=Depends(current_user)):
    require_admin(user)
    res = db().table("listings").select("*").order("created_at", desc=True).limit(200).execute()
    return {"items": [decorate_listing(x) for x in (res.data or [])]}


@app.get("/admin/bookings")
def admin_bookings(user=Depends(current_user)):
    require_admin(user)
    res = db().table("bookings").select("*").order("created_at", desc=True).limit(200).execute()
    rows = res.data or []
    listing_ids = [x.get("listing_id") for x in rows if x.get("listing_id")]
    titles: dict[str, str] = {}
    if listing_ids:
        found = db().table("listings").select("id,title").in_("id", listing_ids).execute()
        titles = {x["id"]: x.get("title") or "" for x in (found.data or [])}
    items = []
    for row in rows:
        item = _public_booking(row)
        item["listing_title"] = titles.get(row.get("listing_id") or "", "")
        items.append(item)
    return {"items": items}


@app.patch("/admin/listings/{listing_id}")
def admin_set_listing(listing_id: str, body: ListingStatusIn, user=Depends(current_user)):
    require_admin(user)
    if body.status not in {"active", "hidden"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = db().table("listings").update({"status": body.status}).eq("id", listing_id).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    return decorate_listing(rows[0])


@app.patch("/admin/users/{user_id}")
def admin_set_user(user_id: str, body: UserStatusIn, user=Depends(current_user)):
    require_admin(user)
    if body.status not in {"active", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account")
    target = profile_of(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if profile_role(target) == "admin":
        raise HTTPException(status_code=400, detail="Admins cannot be suspended here")
    _set_account_status(user_id, body.status)
    fresh = profile_of(user_id) or target
    return _admin_user_row(fresh, _get_auth_user(user_id))


@app.api_route("/admin/{rest:path}", methods=["POST", "PUT", "PATCH", "DELETE"])
def admin_writes(rest: str, user=Depends(current_user)):
    require_admin(user)
    raise HTTPException(status_code=404, detail="Not found")


@app.get("/listings")
def list_listings(
    request: Request,
    status: str = "active",
    category: str | None = None,
    q: str | None = None,
    sort: str = "new",
    mine: bool = False,
    limit: int = 40,
):
    cap = max(1, min(int(limit or 40), 100))
    if mine:
        user = current_user(request.headers.get("authorization"))
        query = db().table("listings").select("*").eq("owner_id", user.id)
    else:
        if status and status != "active":
            user = current_user(request.headers.get("authorization"))
            if not is_admin(user.id):
                raise HTTPException(status_code=403, detail="Admins only")
        query = db().table("listings").select("*")
        if status:
            query = query.eq("status", status)
    if category:
        cats = [c.strip() for c in category.split(",") if c.strip()]
        if len(cats) == 1:
            query = query.eq("category", cats[0])
        elif cats:
            query = query.in_("category", cats)
    if q:
        primary = re.split(r"\s*,\s*", str(q).strip())[0]
        needle = re.sub(r"[,%()*.]", " ", primary).strip()[:80]
        if needle:
            parts = [needle]
            first = re.split(r"\s+", needle)[0]
            if first and len(first) >= 4 and first.lower() != needle.lower():
                parts.append(first)
            clauses = []
            for part in parts:
                like = f"%{part}%"
                clauses.append(f"location.ilike.{like}")
                clauses.append(f"city.ilike.{like}")
            query = query.or_(",".join(clauses))
            cap = max(cap, 100)
    column = "likes_count" if sort == "likes" else "created_at"
    res = query.order(column, desc=True).limit(cap).execute()
    items = [decorate_listing(x) for x in (res.data or [])]
    return {"items": items}


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
        raise HTTPException(status_code=404, detail="Listing not found")
    out = decorate_listing(item)
    social.attach_comment_counts([out])
    return out


@app.post("/listings")
def create_listing(body: ListingIn, user=Depends(current_user)):
    allowed = {"chumba_nyumba", "apartment_airbnb", "store_godown", "frame", "vifaa"}
    if body.category not in allowed:
        raise HTTPException(status_code=400, detail="Invalid category")
    if len(body.title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Title is too short")
    unit = (body.unit or "").strip().lower() or None
    if unit and unit not in UNITS:
        raise HTTPException(status_code=400, detail="Invalid unit")
    if body.stock is not None and body.stock < 0:
        raise HTTPException(status_code=400, detail="Invalid stock")
    period = "" if body.category == "vifaa" else body.period
    if body.category == "vifaa":
        period = unit or ""
    phones = _clean_phones(body.phones, body.phone)
    desc = body.description.strip()[:2000]
    meta: dict = {}
    if body.category == "vifaa" and (unit or body.stock is not None):
        meta["unit"] = unit
        meta["stock"] = body.stock
    if phones:
        meta["phones"] = phones
    if meta:
        desc = with_meta(desc, meta)
    row = {
        "category": body.category,
        "title": body.title.strip()[:200],
        "description": desc,
        "price": body.price,
        "period": period,
        "location": body.location.strip()[:200],
        "city": (body.city or "").strip()[:80],
        "images": body.images[:6],
        "status": "active",
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
    if body.lat is not None:
        extras["lat"] = body.lat
    if body.lng is not None:
        extras["lng"] = body.lng
    if phones:
        extras["phones"] = phones
    res = _save_row("listings", extras, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Could not save")
    return decorate_listing(res.data[0])


@app.patch("/listings/{listing_id}")
def set_listing_status(listing_id: str, body: ListingStatusIn, user=Depends(current_user)):
    require_admin(user)
    if body.status not in {"active", "hidden", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = db().table("listings").update({"status": body.status}).eq("id", listing_id).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    return decorate_listing(rows[0])


@app.post("/listings/{listing_id}/like")
def like_listing(listing_id: str, body: LikeIn, user=Depends(current_user)):
    cur = db().table("listings").select("id,likes_count,owner_id").eq("id", listing_id).limit(1).execute()
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    n = int(rows[0].get("likes_count") or 0) + (1 if body.on else -1)
    if n < 0:
        n = 0
    db().table("listings").update({"likes_count": n}).eq("id", listing_id).execute()
    ping = {"type": "like", "listing_id": listing_id, "likes_count": n, "on": body.on}
    mqtt_bus.notify_listing(listing_id, ping)
    owner = str(rows[0].get("owner_id") or "")
    if owner and owner != user.id:
        mqtt_bus.notify_users([owner], ping)
    return {"id": listing_id, "likes_count": n}


@app.post("/bookings")
def create_booking(body: BookingIn, user=Depends(current_user)):
    listing = decorate_listing(_listing(body.listing_id))
    if body.quantity is not None and body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity")
    raw_stock = listing.get("stock")
    if raw_stock is not None and body.quantity is not None:
        try:
            stock = float(raw_stock)
        except (TypeError, ValueError):
            stock = None
        if stock is not None and body.quantity > stock:
            raise HTTPException(status_code=400, detail="Quantity exceeds stock")
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
        raise HTTPException(status_code=400, detail="Request was not saved")
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
        raise HTTPException(status_code=400, detail="Invalid status")
    cur = db().table("bookings").select("*").eq("id", booking_id).limit(1).execute()
    existing = (cur.data or [None])[0]
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")
    listing = _listing(existing.get("listing_id"))
    if body.status in {"accepted", "rejected"}:
        if listing.get("owner_id") != user.id and not is_admin(user.id):
            raise HTTPException(status_code=403, detail="This is not your listing")
    elif body.status == "moved_in":
        if existing.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="This is not your request")
        if existing.get("status") != "accepted":
            raise HTTPException(status_code=400, detail="Accept the request first")
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
        raise HTTPException(status_code=404, detail="Request not found")
    return _public_booking(rows[0])


@app.post("/reviews")
def create_review(body: ReviewIn, user=Depends(current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1 to 5")
    cur = db().table("bookings").select("*").eq("id", body.booking_id).limit(1).execute()
    booking = (cur.data or [None])[0]
    if not booking:
        raise HTTPException(status_code=404, detail="Request not found")
    if booking.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="This is not your request")
    if booking.get("status") != "moved_in":
        raise HTTPException(status_code=400, detail="Confirm move-in first")
    if review_from_booking(booking):
        raise HTTPException(status_code=400, detail="You already left a review")
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


@app.post("/uploads")
def upload_photo(user=Depends(current_user), file: UploadFile = File(...)):
    return {"url": save_listing_photo(user.id, file)}


@app.get("/places")
def place_suggest(q: str = ""):
    return {"items": places.suggest(q)}


@app.get("/places/details")
def place_details(place_id: str = ""):
    row = places.details(place_id)
    if not row:
        raise HTTPException(status_code=404, detail="Place not found")
    return row


@app.get("/realtime/mqtt")
def mqtt_session(request: Request):
    header = request.headers.get("authorization")
    try:
        user = current_user(header)
        return mqtt_bus.session_for(user.id)
    except HTTPException:
        return mqtt_bus.session_for()


@app.get("/inbox")
def inbox(user=Depends(current_user)):
    return {"items": social.inbox_for(user.id)}


@app.get("/bookings/{booking_id}/messages")
def booking_messages(booking_id: str, user=Depends(current_user)):
    booking = social.booking_row(booking_id)
    if not social.can_see_booking_thread(user, booking):
        raise HTTPException(status_code=403, detail="This is not your conversation")
    return {"items": social.list_thread(f"booking:{booking_id}", user.id)}


@app.post("/bookings/{booking_id}/messages")
def send_booking_message(booking_id: str, body: MessageIn, user=Depends(current_user)):
    booking = social.booking_row(booking_id)
    if not social.can_see_booking_thread(user, booking):
        raise HTTPException(status_code=403, detail="This is not your conversation")
    return social.add_message(
        f"booking:{booking_id}",
        "booking",
        user.id,
        body.body,
        booking_id=booking_id,
        listing_id=booking.get("listing_id"),
    )


@app.get("/listings/{listing_id}/dm")
def listing_dm(listing_id: str, request: Request, user=Depends(current_user)):
    listing = social.listing_row(listing_id)
    owner = str(listing.get("owner_id") or "")
    peer = (request.query_params.get("peer") or "").strip()
    other = peer if user.id == owner and peer else user.id
    key = social.listing_dm_key(listing_id, other, owner)
    if not social.can_see_listing_dm(user, listing, key):
        raise HTTPException(status_code=403, detail="This is not your message")
    return {"items": social.list_thread(key, user.id), "title": listing.get("title"), "owner_id": owner}


@app.post("/listings/{listing_id}/dm")
def send_listing_dm(listing_id: str, body: MessageIn, user=Depends(current_user)):
    listing = social.listing_row(listing_id)
    owner = str(listing.get("owner_id") or "")
    other = body.peer_id.strip() if user.id == owner else user.id
    if user.id == owner and not other:
        raise HTTPException(status_code=400, detail="Choose a recipient")
    if other == owner and user.id == owner:
        raise HTTPException(status_code=400, detail="This is a direct message to the listing owner")
    key = social.listing_dm_key(listing_id, other, owner)
    if not social.can_see_listing_dm(user, listing, key):
        raise HTTPException(status_code=403, detail="This is not your message")
    return social.add_message(key, "listing_dm", user.id, body.body, listing_id=listing_id)


@app.get("/listings/{listing_id}/comments")
def listing_comments(request: Request, listing_id: str):
    social.listing_row(listing_id)
    me = None
    header = request.headers.get("authorization")
    if header:
        try:
            me = current_user(header)
        except HTTPException:
            me = None
    return {"items": social.list_comments(listing_id, me.id if me else None)}


@app.post("/listings/{listing_id}/comments")
def create_comment(listing_id: str, body: CommentIn, user=Depends(current_user)):
    return social.add_comment(listing_id, user.id, body.body, body.parent_id or None)


@app.post("/comments/{comment_id}/like")
def like_comment(comment_id: str, user=Depends(current_user)):
    return social.toggle_comment_like(comment_id, user.id)
