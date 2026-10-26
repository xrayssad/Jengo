from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.security import db

BUCKET = "listing-photos"
ALLOWED = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
}
MAX_BYTES = 6 * 1024 * 1024


def _sniff(kind: str, data: bytes) -> str:
    if kind in ALLOWED:
        return kind
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return kind


def save_listing_photo(user_id: str, file: UploadFile) -> str:
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty photo")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Photo is too large. Choose one under 6MB")
    kind = _sniff((file.content_type or "").split(";")[0].strip().lower(), data)
    ext = ALLOWED.get(kind)
    if not ext:
        raise HTTPException(status_code=400, detail="Use a JPEG, PNG or WebP photo")
    _ensure_bucket()
    path = f"{user_id}/{uuid4().hex}{ext}"
    try:
        db().storage.from_(BUCKET).upload(
            path,
            data,
            file_options={"content-type": kind, "upsert": "false"},
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "bucket" in msg or "not found" in msg:
            _ensure_bucket()
            db().storage.from_(BUCKET).upload(
                path,
                data,
                file_options={"content-type": kind, "upsert": "false"},
            )
        else:
            raise HTTPException(status_code=400, detail="Could not upload the photo")
    public = db().storage.from_(BUCKET).get_public_url(path)
    url = public if isinstance(public, str) else (public.get("publicUrl") if isinstance(public, dict) else "")
    if not url:
        raise HTTPException(status_code=400, detail="Could not upload the photo")
    return url


def _ensure_bucket():
    try:
        db().storage.create_bucket(BUCKET, options={"public": True, "file_size_limit": str(MAX_BYTES)})
    except Exception:
        pass
