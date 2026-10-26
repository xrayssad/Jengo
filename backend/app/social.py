from fastapi import HTTPException

from app.security import db, is_admin, profile_of


def _name(user_id: str) -> str:
    p = profile_of(user_id) or {}
    return str(p.get("username") or p.get("full_name") or p.get("email") or "User")


def listing_row(listing_id: str) -> dict:
    res = db().table("listings").select("id,owner_id,title,status").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Listing not found")
    return rows[0]


def booking_row(booking_id: str) -> dict:
    res = db().table("bookings").select("*").eq("id", booking_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    return rows[0]


def booking_parties(booking: dict) -> tuple[str, str]:
    listing = listing_row(booking.get("listing_id"))
    return str(booking.get("user_id") or ""), str(listing.get("owner_id") or "")


def can_see_booking_thread(user, booking: dict) -> bool:
    buyer, seller = booking_parties(booking)
    return user.id in {buyer, seller} or is_admin(user.id)


def listing_dm_key(listing_id: str, user_id: str, owner_id: str) -> str:
    a, b = sorted([user_id, owner_id])
    return f"listing_dm:{listing_id}:{a}:{b}"


def can_see_listing_dm(user, listing: dict, thread_key: str) -> bool:
    if is_admin(user.id):
        return True
    owner = str(listing.get("owner_id") or "")
    parts = thread_key.split(":")
    members = set(parts[2:]) if len(parts) >= 4 else set()
    return user.id == owner or user.id in members


def public_message(row: dict, me_id: str) -> dict:
    sender = str(row.get("sender_id") or "")
    return {
        "id": row.get("id"),
        "thread_key": row.get("thread_key"),
        "kind": row.get("kind"),
        "booking_id": row.get("booking_id"),
        "listing_id": row.get("listing_id"),
        "sender_id": sender,
        "body": row.get("body"),
        "created_at": row.get("created_at"),
        "mine": sender == me_id,
        "sender_name": _name(sender) if sender else "User",
    }


def list_thread(thread_key: str, me_id: str) -> list[dict]:
    res = (
        db()
        .table("jengo_messages")
        .select("*")
        .eq("thread_key", thread_key)
        .order("created_at")
        .limit(200)
        .execute()
    )
    return [public_message(x, me_id) for x in (res.data or [])]


def add_message(thread_key: str, kind: str, sender_id: str, body: str, booking_id=None, listing_id=None) -> dict:
    text = (body or "").strip()[:2000]
    if not text:
        raise HTTPException(status_code=400, detail="Write a message")
    row = {
        "thread_key": thread_key,
        "kind": kind,
        "sender_id": sender_id,
        "body": text,
        "booking_id": booking_id,
        "listing_id": listing_id,
    }
    res = db().table("jengo_messages").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Message was not saved")
    msg = public_message(res.data[0], sender_id)
    _notify_thread(thread_key, booking_id, sender_id, msg.get("id"))
    return msg


def _notify_thread(thread_key: str, booking_id=None, sender_id=None, message_id=""):
    from app import mqtt_bus

    ids: list[str] = []
    if thread_key.startswith("listing_dm:"):
        ids = [p for p in thread_key.split(":")[2:] if p]
    elif booking_id:
        try:
            buyer, seller = booking_parties(booking_row(booking_id))
            ids = [buyer, seller]
        except Exception:
            ids = []
    sender = str(sender_id or "")
    ids = [i for i in ids if i and str(i) != sender]
    mqtt_bus.notify_users(
        ids,
        {"type": "chat", "thread_key": thread_key, "id": message_id or ""},
    )


def inbox_for(user_id: str) -> list[dict]:
    rows = []
    mine = (
        db()
        .table("jengo_messages")
        .select("*")
        .eq("sender_id", user_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    rows.extend(mine.data or [])
    sent = db().table("bookings").select("id").eq("user_id", user_id).execute()
    owned = db().table("listings").select("id").eq("owner_id", user_id).execute()
    owned_ids = [x["id"] for x in (owned.data or [])]
    incoming = []
    if owned_ids:
        incoming = db().table("bookings").select("id").in_("listing_id", owned_ids).execute().data or []
    booking_ids = [x["id"] for x in (sent.data or [])] + [x["id"] for x in incoming]
    if booking_ids:
        extra = (
            db()
            .table("jengo_messages")
            .select("*")
            .in_("booking_id", booking_ids)
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        rows.extend(extra.data or [])
    if owned_ids:
        dms = (
            db()
            .table("jengo_messages")
            .select("*")
            .eq("kind", "listing_dm")
            .in_("listing_id", owned_ids)
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        rows.extend(dms.data or [])
    rows.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    latest: dict[str, dict] = {}
    for row in rows:
        key = row.get("thread_key")
        if not key or key in latest:
            continue
        latest[key] = row
    items = []
    for row in latest.values():
        title = "Message"
        href = ""
        kind = row.get("kind")
        if kind == "booking" and row.get("booking_id"):
            title = "Request"
            href = f"/bookings/{row['booking_id']}/chat"
            try:
                listing = listing_row(booking_row(row["booking_id"]).get("listing_id"))
                title = listing.get("title") or title
            except Exception:
                pass
        elif kind == "listing_dm" and row.get("listing_id"):
            parts = (row.get("thread_key") or "").split(":")
            members = parts[2:]
            peer = next((m for m in members if m != user_id), "")
            href = f"/chat/{row['listing_id']}" + (f"?peer={peer}" if peer else "")
            try:
                title = listing_row(row["listing_id"]).get("title") or "Direct message"
            except Exception:
                title = "Direct message"
        items.append(
            {
                **public_message(row, user_id),
                "title": title,
                "href": href,
            }
        )
    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return items[:80]


def comment_counts(listing_ids: list[str]) -> dict[str, int]:
    if not listing_ids:
        return {}
    try:
        res = db().table("jengo_comments").select("listing_id").in_("listing_id", listing_ids).execute()
    except Exception:
        return {}
    out: dict[str, int] = {}
    for row in res.data or []:
        lid = str(row.get("listing_id") or "")
        out[lid] = out.get(lid, 0) + 1
    return out


def attach_comment_counts(items: list[dict | None]) -> list[dict | None]:
    ids = [str(x.get("id")) for x in items if x and x.get("id")]
    counts = comment_counts(ids)
    for item in items:
        if item:
            item["comments_count"] = counts.get(str(item.get("id")), 0)
    return items


def list_comments(listing_id: str, me_id: str | None) -> list[dict]:
    res = (
        db()
        .table("jengo_comments")
        .select("*")
        .eq("listing_id", listing_id)
        .order("created_at")
        .limit(300)
        .execute()
    )
    rows = res.data or []
    liked = set()
    if me_id and rows:
        ids = [x["id"] for x in rows]
        likes = (
            db()
            .table("jengo_comment_likes")
            .select("comment_id")
            .eq("user_id", me_id)
            .in_("comment_id", ids)
            .execute()
        )
        liked = {x["comment_id"] for x in (likes.data or [])}
    items = []
    for row in rows:
        items.append(
            {
                "id": row.get("id"),
                "listing_id": row.get("listing_id"),
                "user_id": row.get("user_id"),
                "parent_id": row.get("parent_id"),
                "body": row.get("body"),
                "likes_count": int(row.get("likes_count") or 0),
                "created_at": row.get("created_at"),
                "author": _name(str(row.get("user_id") or "")),
                "liked": row.get("id") in liked,
            }
        )
    return items


def add_comment(listing_id: str, user_id: str, body: str, parent_id: str | None) -> dict:
    listing_row(listing_id)
    text = (body or "").strip()[:2000]
    if not text:
        raise HTTPException(status_code=400, detail="Write a comment")
    if parent_id:
        parent = db().table("jengo_comments").select("id,listing_id").eq("id", parent_id).limit(1).execute()
        prow = (parent.data or [None])[0]
        if not prow or prow.get("listing_id") != listing_id:
            raise HTTPException(status_code=404, detail="Comment not found")
    row = {
        "listing_id": listing_id,
        "user_id": user_id,
        "parent_id": parent_id or None,
        "body": text,
        "likes_count": 0,
    }
    res = db().table("jengo_comments").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Comment was not saved")
    item = res.data[0]
    return {
        "id": item.get("id"),
        "listing_id": listing_id,
        "user_id": user_id,
        "parent_id": item.get("parent_id"),
        "body": text,
        "likes_count": 0,
        "created_at": item.get("created_at"),
        "author": _name(user_id),
        "liked": False,
    }


def toggle_comment_like(comment_id: str, user_id: str) -> dict:
    cur = db().table("jengo_comments").select("*").eq("id", comment_id).limit(1).execute()
    comment = (cur.data or [None])[0]
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    existing = (
        db()
        .table("jengo_comment_likes")
        .select("comment_id")
        .eq("comment_id", comment_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    n = int(comment.get("likes_count") or 0)
    if existing.data:
        db().table("jengo_comment_likes").delete().eq("comment_id", comment_id).eq("user_id", user_id).execute()
        n = max(0, n - 1)
        liked = False
    else:
        db().table("jengo_comment_likes").insert({"comment_id": comment_id, "user_id": user_id}).execute()
        n += 1
        liked = True
    db().table("jengo_comments").update({"likes_count": n}).eq("id", comment_id).execute()
    return {"id": comment_id, "likes_count": n, "liked": liked}
