from fastapi import HTTPException

from app import cloudinary_media
from app.security import db, profile_of


def decorate_reel(row: dict | None, owner: dict | None = None, *, lookup_owner: bool = True) -> dict | None:
    if not row:
        return row
    item = dict(row)
    if owner is None and lookup_owner and item.get("owner_id"):
        owner = profile_of(str(item["owner_id"]))
    p = owner or {}
    item["owner_username"] = str(p.get("username") or "").strip()
    item["owner_name"] = str(p.get("full_name") or "").strip()
    if not item.get("thumb_url") and item.get("public_id"):
        item["thumb_url"] = cloudinary_media.thumb_from_public_id(str(item["public_id"]))
    return item


def decorate_reels(rows: list | None) -> list:
    items = [row for row in (rows or []) if row]
    ids: list[str] = []
    seen: set[str] = set()
    for row in items:
        oid = str(row.get("owner_id") or "")
        if oid and oid not in seen:
            seen.add(oid)
            ids.append(oid)
    owners: dict[str, dict] = {}
    if ids:
        res = db().table("profiles").select("id,username,full_name").in_("id", ids).execute()
        owners = {str(r.get("id")): r for r in (res.data or [])}
    return [
        decorate_reel(row, owners.get(str(row.get("owner_id") or "")), lookup_owner=False)
        for row in items
    ]


def list_reels(limit: int = 40, mine_id: str | None = None) -> list[dict]:
    cap = max(1, min(int(limit or 40), 80))
    query = db().table("reels").select("*")
    if mine_id:
        query = query.eq("owner_id", mine_id)
    else:
        query = query.eq("status", "active")
    res = query.order("created_at", desc=True).limit(cap).execute()
    return decorate_reels(res.data or [])


def get_reel(reel_id: str) -> dict:
    res = db().table("reels").select("*").eq("id", reel_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Reel not found")
    item = decorate_reel(rows[0])
    if not item:
        raise HTTPException(status_code=404, detail="Reel not found")
    return item


def create_reel(user_id: str, caption: str, video_url: str, public_id: str, thumb_url: str = "") -> dict:
    cloudinary_media.require_cloudinary()
    url = (video_url or "").strip()
    pid = (public_id or "").strip()
    if not url or not pid:
        raise HTTPException(status_code=400, detail="Upload the video first")
    if not cloudinary_media.hosted(url):
        raise HTTPException(status_code=400, detail="Use the Cloudinary upload from this app")
    text = (caption or "").strip()[:240]
    thumb = (thumb_url or "").strip() or cloudinary_media.thumb_from_public_id(pid)
    row = {
        "owner_id": user_id,
        "caption": text,
        "video_url": url,
        "thumb_url": thumb,
        "public_id": pid,
        "likes_count": 0,
        "status": "active",
    }
    res = db().table("reels").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Could not save the reel")
    return decorate_reel(res.data[0])


def like_reel(reel_id: str, on: bool, user_id: str) -> dict:
    cur = db().table("reels").select("id,likes_count,owner_id").eq("id", reel_id).limit(1).execute()
    rows = cur.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Reel not found")
    n = int(rows[0].get("likes_count") or 0) + (1 if on else -1)
    if n < 0:
        n = 0
    db().table("reels").update({"likes_count": n}).eq("id", reel_id).execute()
    return {"id": reel_id, "likes_count": n, "owner_id": rows[0].get("owner_id"), "on": on}
