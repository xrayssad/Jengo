import hashlib
import hmac
import os
import re
import secrets
import time

import httpx

OTP_LEN = 6
OTP_TTL = 600
PHONE_KEEP_RE = re.compile(r"[^\d+]")


def as_e164(raw: str | None) -> str:
    s = PHONE_KEEP_RE.sub("", str(raw or "").strip())
    digits = re.sub(r"\D", "", s)
    if digits.startswith("0") and len(digits) == 10:
        digits = "255" + digits[1:]
    if len(digits) == 9 and not digits.startswith("255"):
        digits = "255" + digits
    if digits.startswith("255") and len(digits) == 12:
        return "+" + digits
    if 10 <= len(digits) <= 15:
        return "+" + digits
    return ""


def parse_ident(*vals) -> tuple[str, str]:
    for raw in vals:
        s = str(raw or "").strip()
        if not s:
            continue
        if "@" in s:
            return "email", s.lower()
        phone = as_e164(s)
        if phone:
            return "phone", phone
    return "", ""


def make_code() -> str:
    return f"{secrets.randbelow(10**OTP_LEN):0{OTP_LEN}d}"


def _secret() -> bytes:
    return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "jengo").encode()


def hash_code(code: str) -> str:
    return hmac.new(_secret(), code.encode(), hashlib.sha256).hexdigest()


def codes_match(code: str, digest: str) -> bool:
    if not digest:
        return False
    return hmac.compare_digest(hash_code(code), digest)


def stamp_otp(meta: dict, code: str) -> dict:
    out = dict(meta or {})
    out["jengo_otp"] = hash_code(code)
    out["jengo_otp_exp"] = int(time.time()) + OTP_TTL
    return out


def otp_ok(meta: dict | None, code: str) -> bool:
    data = meta if isinstance(meta, dict) else {}
    exp = int(data.get("jengo_otp_exp") or 0)
    if exp < int(time.time()):
        return False
    return codes_match(code, str(data.get("jengo_otp") or ""))


def clear_otp(meta: dict | None) -> dict:
    out = dict(meta or {})
    out.pop("jengo_otp", None)
    out.pop("jengo_otp_exp", None)
    return out


def send_sms(phone: str, code: str) -> bool:
    text = f"Jengo namba: {code}"
    return _africastalking(phone, text) or _twilio(phone, text) or _webhook(phone, text)


def _africastalking(phone: str, text: str) -> bool:
    key = (os.getenv("AT_API_KEY") or os.getenv("AFRICASTALKING_API_KEY") or "").strip()
    user = (os.getenv("AT_USERNAME") or os.getenv("AFRICASTALKING_USERNAME") or "").strip()
    if not key or not user:
        return False
    sender = (os.getenv("AT_FROM") or os.getenv("AFRICASTALKING_FROM") or "").strip()
    data = {"username": user, "to": phone, "message": text}
    if sender:
        data["from"] = sender
    try:
        res = httpx.post(
            "https://api.africastalking.com/version1/messaging",
            data=data,
            headers={"apiKey": key, "Accept": "application/json"},
            timeout=10.0,
        )
        return res.status_code < 300
    except Exception:
        return False


def _twilio(phone: str, text: str) -> bool:
    sid = (os.getenv("TWILIO_SID") or os.getenv("TWILIO_ACCOUNT_SID") or "").strip()
    token = (os.getenv("TWILIO_TOKEN") or os.getenv("TWILIO_AUTH_TOKEN") or "").strip()
    sender = (os.getenv("TWILIO_FROM") or "").strip()
    if not sid or not token or not sender:
        return False
    try:
        res = httpx.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
            data={"To": phone, "From": sender, "Body": text},
            auth=(sid, token),
            timeout=10.0,
        )
        return res.status_code < 300
    except Exception:
        return False


def _webhook(phone: str, text: str) -> bool:
    url = (os.getenv("SMS_WEBHOOK_URL") or "").strip()
    if not url:
        return False
    try:
        res = httpx.post(url, json={"phone": phone, "message": text}, timeout=10.0)
        return res.status_code < 300
    except Exception:
        return False
