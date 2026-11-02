import logging
import re

from app.security import _as_phones, db, decorate_listings, profile_of, split_desc
from app import reels as reels_mod

log = logging.getLogger("jengo.posts")
PHONE_LINE = re.compile(r"(?:Simu|Phone):\s*(.+)$", re.I | re.M)


def _digits_keys(val) -> set[str]:
    keys: set[str] = set()
    for raw in _as_phones(val):
        digits = re.sub(r"\D", "", str(raw or ""))
        if len(digits) >= 9:
            keys.add(digits[-9:])
    return keys


def _user_phone_keys(user, profile: dict | None) -> set[str]:
    keys = set()
    keys |= _digits_keys(getattr(user, "phone", None))
    keys |= _digits_keys((profile or {}).get("phone"))
    meta = getattr(user, "user_metadata", None) or {}
    if isinstance(meta, dict):
        keys |= _digits_keys(meta.get("phone"))
    return keys


def _listing_phone_keys(item: dict) -> set[str]:
    keys = set()
    keys |= _digits_keys(item.get("phones"))
    keys |= _digits_keys(item.get("phone"))
    clean, meta = split_desc(item.get("description"))
    keys |= _digits_keys(meta.get("phones"))
    keys |= _digits_keys(meta.get("phone"))
    found = PHONE_LINE.search(clean or "")
    if found:
        keys |= _digits_keys(found.group(1).replace(",", " ").split())
        keys |= _digits_keys(found.group(1))
    return keys


def _ownerless(item: dict | None) -> bool:
    return not str((item or {}).get("owner_id") or "").strip()


def _skip(user_id: str, kind: str, item_id: str, reason: str) -> dict:
    log.warning("my posts skip user=%s kind=%s id=%s reason=%s", user_id, kind, item_id, reason)
    return {"id": item_id, "kind": kind, "reason": reason}


def _claim_row(table: str, item_id: str, user_id: str) -> bool:
    res = (
        db()
        .table(table)
        .update({"owner_id": user_id})
        .eq("id", item_id)
        .is_("owner_id", "null")
        .execute()
    )
    if res.data:
        return True
    try:
        res = (
            db()
            .table(table)
            .update({"owner_id": user_id})
            .eq("id", item_id)
            .eq("owner_id", "")
            .execute()
        )
        return bool(res.data)
    except Exception:
        return False


def _prove_listing(user, profile: dict | None, item: dict, remembered: bool) -> tuple[bool, str]:
    owner = str(item.get("owner_id") or "").strip()
    if owner:
        if owner == user.id:
            return False, "already_owned"
        return False, "other_owner"
    listing_phones = _listing_phone_keys(item)
    user_phones = _user_phone_keys(user, profile)
    if listing_phones and user_phones and listing_phones & user_phones:
        return True, "phone_match"
    if remembered and not listing_phones:
        return True, "remembered_id_no_phone"
    if remembered:
        return False, "remembered_id_phone_mismatch"
    return False, "no_proof"


def _one_listing(listing_id: str) -> dict | None:
    res = db().table("listings").select("*").eq("id", listing_id).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def _one_reel(reel_id: str) -> dict | None:
    res = db().table("reels").select("*").eq("id", reel_id).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def _claim_listing(user, profile: dict | None, listing_id: str, remembered: bool) -> dict | None:
    item = _one_listing(listing_id)
    if not item:
        return _skip(user.id, "listing", listing_id, "not_found")
    ok, reason = _prove_listing(user, profile, item, remembered)
    if not ok:
        if reason == "already_owned":
            return None
        return _skip(user.id, "listing", listing_id, reason)
    if not _claim_row("listings", listing_id, user.id):
        fresh = _one_listing(listing_id)
        if str((fresh or {}).get("owner_id") or "") == user.id:
            return None
        return _skip(user.id, "listing", listing_id, "claim_lost_race")
    log.info("claimed listing user=%s id=%s via=%s", user.id, listing_id, reason)
    return None


def _claim_reel(user, reel_id: str, remembered: bool) -> dict | None:
    item = _one_reel(reel_id)
    if not item:
        return _skip(user.id, "reel", reel_id, "not_found")
    owner = str(item.get("owner_id") or "").strip()
    if owner == user.id:
        return None
    if owner:
        return _skip(user.id, "reel", reel_id, "other_owner")
    if not remembered:
        return _skip(user.id, "reel", reel_id, "no_proof")
    if not _claim_row("reels", reel_id, user.id):
        return _skip(user.id, "reel", reel_id, "claim_lost_race")
    log.info("claimed reel user=%s id=%s via=remembered_id", user.id, reel_id)
    return None


def claim(user, listing_ids: list[str] | None = None, reel_ids: list[str] | None = None) -> dict:
    profile = profile_of(user.id)
    skipped: list[dict] = []
    seen: set[str] = set()
    for raw in listing_ids or []:
        listing_id = str(raw or "").strip()
        if not listing_id or listing_id in seen:
            continue
        seen.add(listing_id)
        miss = _claim_listing(user, profile, listing_id, remembered=True)
        if miss:
            skipped.append(miss)
    seen_reels: set[str] = set()
    for raw in reel_ids or []:
        reel_id = str(raw or "").strip()
        if not reel_id or reel_id in seen_reels:
            continue
        seen_reels.add(reel_id)
        miss = _claim_reel(user, reel_id, remembered=True)
        if miss:
            skipped.append(miss)
    return {"ok": True, "skipped": skipped}


def _jobs_mine(user_id: str) -> list[dict]:
    try:
        from app import jobs as jobs_mod

        return jobs_mod.list_mine(user_id)
    except Exception as exc:
        log.warning("my jobs failed user=%s err=%s", user_id, exc)
        return []


def mine(user, listing_ids: list[str] | None = None, reel_ids: list[str] | None = None) -> dict:
    claimed = claim(user, listing_ids, reel_ids)
    listings_res = (
        db()
        .table("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", desc=True)
        .limit(300)
        .execute()
    )
    return {
        "listings": decorate_listings(listings_res.data or []),
        "reels": reels_mod.list_reels(80, mine_id=user.id),
        "jobs": _jobs_mine(user.id),
        "skipped": claimed.get("skipped") or [],
    }
