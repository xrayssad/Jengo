#!/usr/bin/env python3
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

API = os.getenv("TEST_API_URL", "http://127.0.0.1:8000")
URL = os.environ["SUPABASE_URL"]
SERVICE = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SELLER = {
    "email": "seller@jengo.app",
    "password": "TestSeller#2026",
    "username": "jengo_seller",
    "full_name": "Jengo Seller",
    "role": "user",
}
BUYER = {
    "email": "buyer@jengo.app",
    "password": "TestBuyer#2026",
    "username": "jengo_buyer",
    "full_name": "Jengo Buyer",
    "role": "user",
}
ADMIN = {
    "email": "admin@jengo.app",
    "password": "TestAdmin#2026",
    "username": "jengo_admin",
    "full_name": "Jengo Admin",
    "role": "admin",
}


def admin_client():
    return create_client(URL, SERVICE)


def find_user(sb, email: str):
    page = 1
    while page < 10:
        res = sb.auth.admin.list_users(page=page, per_page=200)
        users = getattr(res, "users", None)
        if users is None:
            users = list(res) if res is not None else []
        for u in users:
            if getattr(u, "email", "") == email:
                return u
        if len(users) < 200:
            break
        page += 1
    return None


def ensure_user(spec: dict) -> str:
    sb = admin_client()
    existing = find_user(sb, spec["email"])
    if existing:
        sb.auth.admin.update_user_by_id(
            existing.id,
            {
                "password": spec["password"],
                "email_confirm": True,
                "user_metadata": {"username": spec["username"], "full_name": spec["full_name"]},
            },
        )
        uid = existing.id
    else:
        try:
            created = sb.auth.admin.create_user(
                {
                    "email": spec["email"],
                    "password": spec["password"],
                    "email_confirm": True,
                    "user_metadata": {"username": spec["username"], "full_name": spec["full_name"]},
                }
            )
            user = getattr(created, "user", created)
            uid = getattr(user, "id", None)
        except Exception:
            existing = find_user(sb, spec["email"])
            if not existing:
                raise
            uid = existing.id
    if not uid:
        raise RuntimeError(f"No id for {spec['email']}")
    row = {
        "id": uid,
        "email": spec["email"],
        "username": spec["username"],
        "full_name": spec["full_name"],
        "role": spec["role"],
    }
    cur = sb.table("profiles").select("id").eq("id", uid).limit(1).execute()
    if cur.data:
        sb.table("profiles").update(row).eq("id", uid).execute()
    else:
        taken = sb.table("profiles").select("id").eq("username", spec["username"]).limit(1).execute()
        if taken.data and taken.data[0]["id"] != uid:
            row["username"] = spec["username"][:16] + "_x"
        sb.table("profiles").insert(row).execute()
    return uid


def api(method: str, path: str, token: str | None = None, json=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    res = httpx.request(method, f"{API}{path}", headers=headers, json=json, timeout=40)
    data = None
    try:
        data = res.json()
    except Exception:
        data = {"detail": res.text}
    if res.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {res.status_code} {data}")
    return data


def login(spec: dict) -> str:
    data = api("POST", "/auth/login", json={"email": spec["email"], "password": spec["password"]})
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"No token for {spec['email']}: {data}")
    return token


def main():
    results = []
    print("Creating users...")
    ensure_user(SELLER)
    ensure_user(BUYER)
    ensure_user(ADMIN)
    health = api("GET", "/health")
    print("health", health.get("ok"))

    def rec(step: str, ok: bool, note: str = ""):
        results.append((step, ok, note))
        print(("PASS" if ok else "FAIL"), step, note)

    try:
        seller = login(SELLER)
        vifaa = api(
            "POST",
            "/listings",
            seller,
            {
                "category": "vifaa",
                "title": "Simenti Simba 42.5",
                "description": "Mfuko wa simenti",
                "price": 18500,
                "location": "Kariakoo",
                "city": "Dar es Salaam",
                "unit": "mfuko",
                "stock": 40,
            },
        )
        chumba = api(
            "POST",
            "/listings",
            seller,
            {
                "category": "chumba_nyumba",
                "title": "Chumba Kinondoni",
                "description": "Chumba kimoja",
                "price": 250000,
                "period": "mwezi",
                "location": "Kinondoni",
                "city": "Dar es Salaam",
            },
        )
        rec("1. Seller logs in and posts vifaa + chumba", True, f"{vifaa.get('id')} {chumba.get('id')}")
    except Exception as exc:
        rec("1. Seller logs in and posts vifaa + chumba", False, str(exc))
        write_report(results)
        return 1

    try:
        admin = login(ADMIN)
        api("PATCH", f"/listings/{vifaa['id']}", admin, {"status": "active"})
        api("PATCH", f"/listings/{chumba['id']}", admin, {"status": "active"})
        rec("2. Admin publishes both", True)
    except Exception as exc:
        rec("2. Admin publishes both", False, str(exc))
        write_report(results)
        return 1

    try:
        buyer = login(BUYER)
        found_v = api("GET", "/listings?category=vifaa&status=active")
        found_c = api("GET", "/listings?category=chumba_nyumba&status=active")
        vids = {x["id"] for x in found_v.get("items") or []}
        cids = {x["id"] for x in found_c.get("items") or []}
        if vifaa["id"] not in vids or chumba["id"] not in cids:
            raise RuntimeError("Buyer did not find both published listings")
        req_v = api("POST", "/bookings", buyer, {"listing_id": vifaa["id"], "message": "Naomba mifuko 2", "quantity": 2})
        req_c = api("POST", "/bookings", buyer, {"listing_id": chumba["id"], "message": "Naomba chumba"})
        rec("3. Buyer logs in, finds both, sends requests", True, f"{req_v.get('id')} {req_c.get('id')}")
    except Exception as exc:
        rec("3. Buyer logs in, finds both, sends requests", False, str(exc))
        write_report(results)
        return 1

    try:
        api("PATCH", f"/bookings/{req_v['id']}", seller, {"status": "accepted"})
        api("PATCH", f"/bookings/{req_c['id']}", seller, {"status": "accepted"})
        rec("4. Seller accepts both", True)
    except Exception as exc:
        rec("4. Seller accepts both", False, str(exc))
        write_report(results)
        return 1

    try:
        moved = api("PATCH", f"/bookings/{req_c['id']}", buyer, {"status": "moved_in"})
        rec("5. Buyer confirms move-in on chumba", moved.get("status") == "moved_in", str(moved.get("status")))
    except Exception as exc:
        rec("5. Buyer confirms move-in on chumba", False, str(exc))
        write_report(results)
        return 1

    try:
        review = api("POST", "/reviews", buyer, {"booking_id": req_c["id"], "rating": 5, "comment": "Nyumba nzuri"})
        rec("6. Buyer submits 5-star review", review.get("rating") == 5, str(review))
    except Exception as exc:
        rec("6. Buyer submits 5-star review", False, str(exc))

    try:
        nyumba = api("GET", "/listings?category=chumba_nyumba&status=active")
        vifaa_page = api("GET", "/listings?category=vifaa&status=active")
        n_ids = {x["id"] for x in nyumba.get("items") or []}
        v_ids = {x["id"] for x in vifaa_page.get("items") or []}
        ok = vifaa["id"] not in n_ids and chumba["id"] not in v_ids and vifaa["id"] in v_ids and chumba["id"] in n_ids
        rec("7. Category isolation", ok, f"vifaa_on_nyumba={vifaa['id'] in n_ids} chumba_on_vifaa={chumba['id'] in v_ids}")
    except Exception as exc:
        rec("7. Category isolation", False, str(exc))

    write_report(results)
    return 0 if all(ok for _, ok, _ in results) else 1


def write_report(results):
    repo = ROOT.parent
    lines = [
        "# Test accounts",
        "",
        "Do not put the service role key in this file.",
        "",
        "## Accounts",
        "",
        "| Role | Email | Password | Username | Full name | Admin |",
        "| --- | --- | --- | --- | --- | --- |",
        "| Seller | seller@jengo.app | TestSeller#2026 | jengo_seller | Jengo Seller | false |",
        "| Buyer | buyer@jengo.app | TestBuyer#2026 | jengo_buyer | Jengo Buyer | false |",
        "",
        "An extra admin account `admin@jengo.app` / `TestAdmin#2026` / `jengo_admin` was created only so step 2 can publish through the real admin API. Seller and buyer stay non-admin.",
        "",
        "## Transaction path",
        "",
    ]
    for step, ok, note in results:
        mark = "PASS" if ok else "FAIL"
        extra = f" — {note}" if note else ""
        lines.append(f"- {mark}: {step}{extra}")
    lines.append("")
    (repo / "TEST-ACCOUNTS.md").write_text("\n".join(lines), encoding="utf-8")
    print("Wrote", repo / "TEST-ACCOUNTS.md")


if __name__ == "__main__":
    sys.exit(main())
