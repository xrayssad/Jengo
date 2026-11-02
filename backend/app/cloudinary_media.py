import hashlib
import os
import time

from fastapi import HTTPException

FOLDER = "jengo/reels"
MAX_BYTES = 250 * 1024 * 1024
MAX_SECONDS = 180

# Instagram / TikTok / YouTube Shorts delivery: 9:16 MP4, H.264 Baseline + AAC.
# Parameter order is alphabetical so eager URLs match playback URLs.
PLAY_TRANS = "ac_aac,af_44100,c_fill,du_180,f_mp4,fps_30,g_center,h_1280,q_auto:good,vc_h264:baseline:3.1,w_720"
THUMB_TRANS = "c_fill,f_jpg,g_center,h_1280,q_auto,so_0,w_720"


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


def _sign(params: dict[str, str]) -> str:
    blob = "&".join(f"{k}={v}" for k, v in sorted(params.items())) + api_secret()
    return hashlib.sha1(blob.encode("utf-8")).hexdigest()


def sign_video_upload() -> dict:
    require_cloudinary()
    ts = int(time.time())
    params = {
        "eager": PLAY_TRANS,
        "eager_async": "true",
        "folder": FOLDER,
        "timestamp": str(ts),
    }
    name = cloud_name()
    return {
        "cloud_name": name,
        "api_key": api_key(),
        "timestamp": ts,
        "signature": _sign(params),
        "folder": FOLDER,
        "eager": PLAY_TRANS,
        "eager_async": True,
        "upload_url": f"https://api.cloudinary.com/v1_1/{name}/video/upload",
        "max_bytes": MAX_BYTES,
        "max_seconds": MAX_SECONDS,
    }


def hosted(url: str) -> bool:
    raw = (url or "").strip()
    name = cloud_name()
    return bool(name) and raw.startswith("https://") and f"res.cloudinary.com/{name}/" in raw


def thumb_from_public_id(public_id: str) -> str:
    pid = (public_id or "").strip().lstrip("/")
    if not pid or not cloud_name():
        return ""
    return f"https://res.cloudinary.com/{cloud_name()}/video/upload/{THUMB_TRANS}/{pid}.jpg"


def play_from_public_id(public_id: str) -> str:
    pid = (public_id or "").strip().lstrip("/")
    if not pid or not cloud_name():
        return ""
    return f"https://res.cloudinary.com/{cloud_name()}/video/upload/{PLAY_TRANS}/{pid}.mp4"
