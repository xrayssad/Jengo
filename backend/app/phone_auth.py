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


def otp_text(code: str) -> str:
    return f"Jengo namba: {code}"


def send_sms(phone: str, code: str) -> bool:
    text = otp_text(code)
    return _africastalking(phone, text) or _twilio(phone, text) or _webhook(phone, text)


def send_email(to: str, code: str) -> bool:
    text = otp_text(code)
    return _resend(to, text) or _sendgrid(to, text) or _brevo(to, text) or _smtp(to, text) or _email_webhook(to, text)


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


def _mail_from() -> str:
    return (os.getenv("MAIL_FROM") or os.getenv("SMTP_FROM") or os.getenv("RESEND_FROM") or "Jengo <noreply@jengo.app>").strip()


def _resend(to: str, text: str) -> bool:
    key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not key:
        return False
    try:
        res = httpx.post(
            "https://api.resend.com/emails",
            json={"from": _mail_from(), "to": [to], "subject": "Jengo namba", "text": text},
            headers={"Authorization": f"Bearer {key}"},
            timeout=10.0,
        )
        return res.status_code < 300
    except Exception:
        return False


def _sendgrid(to: str, text: str) -> bool:
    key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    if not key:
        return False
    sender = _mail_from()
    try:
        res = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": sender[sender.find("<") + 1 : sender.find(">")] if "<" in sender else sender, "name": "Jengo"},
                "subject": "Jengo namba",
                "content": [{"type": "text/plain", "value": text}],
            },
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=10.0,
        )
        return res.status_code < 300
    except Exception:
        return False


def _brevo(to: str, text: str) -> bool:
    key = (os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY") or "").strip()
    if not key:
        return False
    sender = _mail_from()
    email = sender[sender.find("<") + 1 : sender.find(">")] if "<" in sender else sender
    try:
        res = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            json={
                "sender": {"email": email, "name": "Jengo"},
                "to": [{"email": to}],
                "subject": "Jengo namba",
                "textContent": text,
            },
            headers={"api-key": key, "Accept": "application/json"},
            timeout=10.0,
        )
        return res.status_code < 300
    except Exception:
        return False


def _smtp(to: str, text: str) -> bool:
    host = (os.getenv("SMTP_HOST") or "").strip()
    user = (os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or "").strip()
    password = (os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or "").strip()
    if not host or not user or not password:
        return False
    port = int(os.getenv("SMTP_PORT") or "587")
    sender = _mail_from()
    from_addr = sender[sender.find("<") + 1 : sender.find(">")] if "<" in sender else sender
    message = f"From: {sender}\r\nTo: {to}\r\nSubject: Jengo namba\r\n\r\n{text}\r\n"
    try:
        import smtplib
        import ssl

        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=10) as smtp:
                smtp.login(user, password)
                smtp.sendmail(from_addr, [to], message)
        else:
            with smtplib.SMTP(host, port, timeout=10) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                smtp.login(user, password)
                smtp.sendmail(from_addr, [to], message)
        return True
    except Exception:
        return False


def _email_webhook(to: str, text: str) -> bool:
    url = (os.getenv("EMAIL_WEBHOOK_URL") or "").strip()
    if not url:
        return False
    try:
        res = httpx.post(url, json={"email": to, "message": text}, timeout=10.0)
        return res.status_code < 300
    except Exception:
        return False
