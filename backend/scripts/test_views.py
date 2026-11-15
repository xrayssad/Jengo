"""View counting rules. The database test rolls back, so it does not keep a count."""

import os
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

os.environ.pop("COUNT_OWN_VIEWS_IN_DEV", None)
os.environ.pop("VIEW_DEDUP_WINDOW_MINUTES", None)

from app.trust import count_own_views, view_skip_reason, view_window_minutes, window_start


class ViewRules(unittest.TestCase):
    def test_default_window_is_30_minutes(self):
        self.assertEqual(view_window_minutes(), 30)

    def test_same_viewer_inside_the_window_shares_a_bucket(self):
        start = datetime(2026, 11, 15, 10, 0, tzinfo=timezone.utc)
        self.assertEqual(window_start(start, 30), window_start(start + timedelta(minutes=10), 30))

    def test_same_viewer_after_the_window_gets_a_new_bucket(self):
        start = datetime(2026, 11, 15, 10, 0, tzinfo=timezone.utc)
        self.assertNotEqual(window_start(start, 30), window_start(start + timedelta(minutes=31), 30))

    def test_owner_does_not_count(self):
        self.assertEqual(
            view_skip_reason(ua="Mozilla", status="active", owner_id="owner", user_id="owner"),
            "owner",
        )

    def test_owner_counts_only_with_the_dev_flag(self):
        os.environ["COUNT_OWN_VIEWS_IN_DEV"] = "true"
        os.environ["APP_ENV"] = "development"
        try:
            self.assertTrue(count_own_views())
            self.assertIsNone(view_skip_reason(ua="Mozilla", status="active", owner_id="owner", user_id="owner"))
        finally:
            os.environ.pop("COUNT_OWN_VIEWS_IN_DEV", None)
            os.environ.pop("APP_ENV", None)

    def test_owner_flag_is_ignored_in_production(self):
        os.environ["COUNT_OWN_VIEWS_IN_DEV"] = "true"
        os.environ["APP_ENV"] = "production"
        try:
            self.assertFalse(count_own_views())
            self.assertEqual(
                view_skip_reason(ua="Mozilla", status="active", owner_id="owner", user_id="owner"),
                "owner",
            )
        finally:
            os.environ.pop("COUNT_OWN_VIEWS_IN_DEV", None)
            os.environ.pop("APP_ENV", None)

    def test_bots_do_not_count(self):
        self.assertEqual(view_skip_reason(ua="Googlebot", status="active", owner_id="o", user_id=None), "bot")

    def test_another_viewer_is_allowed(self):
        self.assertIsNone(view_skip_reason(ua="Mozilla", status="active", owner_id="owner", user_id="guest"))


def _database_url() -> str:
    env = Path(__file__).resolve().parents[1] / ".env"
    if not env.exists():
        return ""
    for line in env.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            if "sslmode=" not in url:
                url += ("&" if "?" in url else "?") + "sslmode=require"
            return url
    return ""


class ViewSql(unittest.TestCase):
    def test_window_insert_counts_once_then_again_after_the_window(self):
        url = _database_url()
        if not url:
            self.skipTest("no database")
        import psycopg2

        conn = psycopg2.connect(url)
        try:
            conn.autocommit = False
            with conn.cursor() as cur:
                cur.execute("select id from listings where status = 'active' limit 1")
                row = cur.fetchone()
                if not row:
                    self.skipTest("no listing")
                listing = row[0]
                cur.execute("select views_count from listings where id = %s", (listing,))
                before = cur.fetchone()[0]
                viewer = f"test-{uuid4()}"
                cur.execute("select counted, views_count from record_listing_view(%s, %s, %s)", (listing, viewer, 30))
                first = cur.fetchone()
                cur.execute("select counted, views_count from record_listing_view(%s, %s, %s)", (listing, viewer, 30))
                second = cur.fetchone()
                past = datetime.now(timezone.utc) - timedelta(minutes=40)
                cur.execute(
                    """
                    insert into listing_views (listing_id, viewer_key, day, window_start)
                    values (%s, %s, %s::date, %s)
                    on conflict (listing_id, viewer_key, window_start) do nothing
                    """,
                    (listing, f"{viewer}-past", past.date().isoformat(), past),
                )
                self.assertTrue(first[0])
                self.assertEqual(first[1], (before or 0) + 1)
                self.assertFalse(second[0])
                self.assertEqual(second[1], first[1])
                self.assertEqual(cur.rowcount, 1)
            conn.rollback()
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
