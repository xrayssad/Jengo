import logging

from fastapi import HTTPException

from app.security import db, split_desc, with_meta

log = logging.getLogger("jengo.jobs")

STATUSES = {"open", "closed", "awarded"}


def connection_fee(budget) -> dict:
    try:
        n = float(budget or 0)
    except (TypeError, ValueError):
        n = 0
    if n < 300_000:
        return {"size": "small", "label": "ndogo", "fee": 4000, "range": "3000–5000"}
    if n < 1_500_000:
        return {"size": "medium", "label": "wastani", "fee": 7500, "range": "5000–10000"}
    return {"size": "large", "label": "kubwa", "fee": 15000, "range": "10000–20000"}


def _save_row(table: str, row: dict, fallback: dict):
    try:
        return db().table(table).insert(row).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "column" in msg or "pgrst204" in msg or "schema cache" in msg:
            return db().table(table).insert(fallback).execute()
        raise


def _update_row(table: str, item_id: str, row: dict, fallback: dict | None = None):
    try:
        return db().table(table).update(row).eq("id", item_id).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if fallback is not None and ("column" in msg or "pgrst204" in msg or "schema cache" in msg):
            return db().table(table).update(fallback).eq("id", item_id).execute()
        raise


def decorate_job(row: dict | None, offers: list[dict] | None = None, *, owner_view: bool = False) -> dict | None:
    if not row:
        return row
    item = dict(row)
    clean, meta = split_desc(item.get("description"))
    item["description"] = clean
    images = item.get("images")
    if not images:
        images = meta.get("images") or []
    item["images"] = [str(u) for u in images if str(u).strip()][:6]
    fee = connection_fee(item.get("budget"))
    stored = item.get("connection_fee")
    if stored is None and meta.get("connection_fee") is not None:
        stored = meta.get("connection_fee")
    item["connection_fee"] = int(stored if stored is not None else fee["fee"])
    item["fee_size"] = fee["size"]
    item["fee_label"] = fee["label"]
    item["fee_range"] = fee["range"]
    item["fee_status"] = item.get("fee_status") or meta.get("fee_status") or "none"
    rows = offers if offers is not None else []
    item["offers_count"] = len(rows)
    if owner_view:
        item["offers"] = [decorate_offer(o, hide_contact=False) for o in rows]
    else:
        item["offers"] = []
    return item


def decorate_offer(row: dict | None, *, hide_contact: bool = False) -> dict | None:
    if not row:
        return row
    item = dict(row)
    if hide_contact:
        item.pop("contact", None)
    return item


def _job(job_id: str) -> dict:
    res = db().table("jobs").select("*").eq("id", job_id).limit(1).execute()
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Kazi haikupatikana")
    return rows[0]


def _offers(job_id: str) -> list[dict]:
    res = (
        db()
        .table("job_offers")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return res.data or []


def _offer_counts(job_ids: list[str]) -> dict[str, int]:
    if not job_ids:
        return {}
    res = db().table("job_offers").select("job_id").in_("job_id", job_ids).execute()
    counts: dict[str, int] = {}
    for row in res.data or []:
        jid = str(row.get("job_id") or "")
        if jid:
            counts[jid] = counts.get(jid, 0) + 1
    return counts


def list_jobs(status: str | None = "open") -> list[dict]:
    query = db().table("jobs").select("*")
    want = (status or "open").strip().lower()
    if want in STATUSES:
        query = query.eq("status", want)
    res = query.order("created_at", desc=True).limit(80).execute()
    rows = res.data or []
    counts = _offer_counts([str(r.get("id")) for r in rows if r.get("id")])
    out = []
    for row in rows:
        item = decorate_job(row, [], owner_view=False)
        if item:
            item["offers_count"] = counts.get(str(row.get("id")), 0)
            out.append(item)
    return out


def list_mine(user_id: str) -> list[dict]:
    res = (
        db()
        .table("jobs")
        .select("*")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .limit(80)
        .execute()
    )
    return [decorate_job(row, [], owner_view=False) for row in (res.data or [])]


def get_job(job_id: str, user_id: str | None = None) -> dict:
    row = _job(job_id)
    offers = _offers(job_id)
    owner = str(row.get("owner_id") or "")
    return decorate_job(row, offers, owner_view=bool(user_id and user_id == owner))


def create_job(
    user_id: str,
    title: str,
    description: str,
    location: str,
    city: str,
    budget: float,
    deadline: str,
    images: list[str] | None = None,
) -> dict:
    heading = (title or "").strip()[:200]
    if len(heading) < 3:
        raise HTTPException(status_code=400, detail="Andika kichwa cha kazi")
    place = (location or "").strip()[:200]
    if not place:
        raise HTTPException(status_code=400, detail="Andika eneo")
    try:
        money = float(budget)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Andika bajeti")
    if money <= 0:
        raise HTTPException(status_code=400, detail="Andika bajeti")
    due = (deadline or "").strip()[:40]
    if not due:
        raise HTTPException(status_code=400, detail="Andika tarehe ya mwisho")
    photos = [str(u).strip() for u in (images or []) if str(u).strip()][:6]
    desc = (description or "").strip()[:2000]
    fee = connection_fee(money)
    meta = {"images": photos, "connection_fee": fee["fee"], "fee_status": "none"}
    stored_desc = with_meta(desc, meta) if photos else desc
    row = {
        "owner_id": user_id,
        "title": heading,
        "description": stored_desc,
        "location": place,
        "city": (city or "").strip()[:80],
        "budget": money,
        "deadline": due,
        "status": "open",
    }
    extras = dict(row)
    extras["images"] = photos
    extras["connection_fee"] = fee["fee"]
    extras["fee_status"] = "none"
    res = _save_row("jobs", extras, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Imeshindwa kuhifadhi kazi")
    return decorate_job(res.data[0], [], owner_view=True)


def create_offer(job_id: str, worker_name: str, contact: str, amount: float, message: str, user_id: str | None = None) -> dict:
    job = _job(job_id)
    if (job.get("status") or "open") != "open":
        raise HTTPException(status_code=400, detail="Kazi hii imefungwa")
    if user_id and str(job.get("owner_id") or "") == user_id:
        raise HTTPException(status_code=400, detail="Huwezi kuweka ofa kwenye kazi yako")
    name = (worker_name or "").strip()[:120]
    phone = (contact or "").strip()[:40]
    note = (message or "").strip()[:1000]
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Andika jina")
    if len(phone) < 9:
        raise HTTPException(status_code=400, detail="Andika namba ya simu")
    try:
        money = float(amount)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Andika kiasi")
    if money <= 0:
        raise HTTPException(status_code=400, detail="Andika kiasi")
    row = {
        "job_id": job_id,
        "worker_name": name,
        "contact": phone,
        "amount": money,
        "message": note,
        "status": "submitted",
    }
    res = _save_row("job_offers", row, row)
    if not res.data:
        raise HTTPException(status_code=400, detail="Imeshindwa kuhifadhi ofa")
    return decorate_offer(res.data[0])


def award_job(job_id: str, offer_id: str, user_id: str) -> dict:
    job = _job(job_id)
    if str(job.get("owner_id") or "") != user_id:
        raise HTTPException(status_code=403, detail="Si kazi yako")
    if (job.get("status") or "open") != "open":
        raise HTTPException(status_code=400, detail="Kazi hii imeshachaguliwa")
    offers = _offers(job_id)
    if not offers:
        log.info("award blocked no worker job=%s user=%s", job_id, user_id)
        raise HTTPException(status_code=400, detail="Hakuna fundi bado. Ada hailipwi.")
    chosen = next((o for o in offers if str(o.get("id")) == str(offer_id)), None)
    if not chosen:
        raise HTTPException(status_code=404, detail="Ofa haikupatikana")
    if (chosen.get("status") or "submitted") != "submitted":
        raise HTTPException(status_code=400, detail="Ofa hii haiwezi kuchaguliwa")
    fee = connection_fee(job.get("budget"))
    clean, meta = split_desc(job.get("description"))
    meta["connection_fee"] = fee["fee"]
    meta["fee_status"] = "due"
    meta["awarded_offer_id"] = offer_id
    extras = {
        "status": "awarded",
        "description": with_meta(clean, meta),
        "connection_fee": fee["fee"],
        "fee_status": "due",
        "awarded_offer_id": offer_id,
    }
    fallback = {"status": "awarded", "description": with_meta(clean, meta)}
    updated = _update_row("jobs", job_id, extras, fallback)
    rows = updated.data or []
    if not rows:
        raise HTTPException(status_code=400, detail="Imeshindwa kuchagua fundi")
    db().table("job_offers").update({"status": "awarded"}).eq("id", offer_id).eq("job_id", job_id).execute()
    others = [str(o.get("id")) for o in offers if str(o.get("id")) != str(offer_id)]
    if others:
        db().table("job_offers").update({"status": "rejected"}).eq("job_id", job_id).in_("id", others).execute()
    log.info(
        "job awarded job=%s offer=%s fee=%s size=%s user=%s",
        job_id,
        offer_id,
        fee["fee"],
        fee["size"],
        user_id,
    )
    return get_job(job_id, user_id)
