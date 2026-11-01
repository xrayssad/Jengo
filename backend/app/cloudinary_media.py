import hashlib
import os
import time

from fastapi import HTTPException

FOLDER = "jengo/reels"
MAX_BYTES = 80 * 1024 * 1024


def cloud_name() -> str:
    return (os.getenv("CLOUDINARY_CLOUD_NAME") or "").strip()


def api_key() -> str:
    return (os.getenv("CLOUDINARY_API_KEY") or "").strip()


def api_secret() -> str:
    return (os.getenv("CLOUDINARY_API_SECRET") or "").strip()


def configured() -> bool:
    return bool(cloud_name() and api_key() and api_secret())


def require_cloudinary():
    if not configured():
        raise HTTPException(status_code=503, detail="Add Cloudinary keys to the server, then try again")


def sign_video_upload() -> dict:
    require_cloudinary()
    ts = int(time.time())
    params = {"folder": FOLDER, "timestamp": str(ts)}
    blob = "&".join(f"{k}={v}" for k, v in sorted(params.items())) + api_secret()
    signature = hashlib.sha1(blob.encode("utf-8")).hexdigest()
    name = cloud_name()
    return {
        "cloud_name": name,
        "api_key": api_key(),
        "timestamp": ts,
        "signature": signature,
        "folder": FOLDER,
        "upload_url": f"https://api.cloudinary.com/v1_1/{name}/video/upload",
        "max_bytes": MAX_BYTES,
    }


def hosted(url: str) -> bool:
    raw = (url or "").strip()
    name = cloud_name()
    return bool(name) and raw.startswith("https://") and f"res.cloudinary.com/{name}/" in raw


def thumb_from_public_id(public_id: str) -> str:
    pid = (public_id or "").strip().lstrip("/")
    if not pid or not cloud_name():
        return ""
    return f"https://res.cloudinary.com/{cloud_name()}/video/upload/so_0,w_720,h_1280,c_fill,q_auto,f_jpg/{pid}.jpg"


def play_from_public_id(public_id: str) -> str:
    pid = (public_id or "").strip().lstrip("/")
    if not pid or not cloud_name():
        return ""
    return f"https://res.cloudinary.com/{cloud_name()}/video/upload/f_mp4,vc_h264,ac_aac,q_auto/{pid}.mp4"
