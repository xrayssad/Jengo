"""Price totals, stale listings, booking overlap, reviews and payment confirmation."""

import unittest
from datetime import datetime, timedelta, timezone

from app.pricing import (
    dates_overlap,
    is_stale,
    needs_confirm,
    payment_confirmed,
    quote_stay,
    review_allowed,
)


class PricingTests(unittest.TestCase):
    def test_room_move_in_adds_every_fee(self):
        quote = quote_stay(
            "chumba_nyumba",
            100000,
            {"months_advance": 2, "deposit": 100000, "agent_fee": 50000, "other_fee": 10000},
        )
        self.assertEqual(quote["due"], 100000 * 2 + 100000 + 50000 + 10000)
        self.assertEqual([line["key"] for line in quote["lines"]], ["rent", "deposit", "agent_fee", "other_fee"])

    def test_airbnb_keeps_deposit_out_of_the_stay_total(self):
        quote = quote_stay(
            "apartment_airbnb",
            80000,
            {"cleaning_fee": 15000, "extra_guest_fee": 10000, "included_guests": 2, "deposit": 50000},
            {"nights": 3, "guests": 4},
        )
        self.assertEqual(quote["due"], 80000 * 3 + 15000 + 10000 * 2 * 3)
        self.assertEqual(quote["deposit"], 50000)
        self.assertNotIn("deposit", [line["key"] for line in quote["lines"]])

    def test_shop_goodwill_is_one_line(self):
        quote = quote_stay("frame", 200000, {"months_advance": 3, "deposit": 200000, "goodwill": 500000})
        self.assertEqual(quote["due"], 200000 * 3 + 200000 + 500000)

    def test_godown_adds_vat_when_excluded(self):
        quote = quote_stay(
            "store_godown",
            0,
            {"subtype": "godown", "size_m2": 10, "price_per_sqm": 10000, "vat": "excluded", "months_advance": 2, "deposit": 50000},
        )
        month = int(round(10000 * 10 * 1.18))
        self.assertEqual(quote["due"], month * 2 + 50000)

    def test_goods_add_delivery(self):
        quote = quote_stay("vifaa", 25000, {"min_order": 4, "delivery_fee": 8000}, {"quantity": 4})
        self.assertEqual(quote["due"], 25000 * 4 + 8000)

    def test_missing_confirmation_stays_searchable(self):
        self.assertFalse(is_stale({"fit": {}}))

    def test_unconfirmed_for_30_days_hides(self):
        old = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
        self.assertTrue(is_stale({"fit": {"last_confirmed_at": old}}))
        recent = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        self.assertFalse(is_stale({"fit": {"last_confirmed_at": recent}}))
        self.assertFalse(needs_confirm({"fit": {"last_confirmed_at": recent}}))
        due = (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        self.assertFalse(is_stale({"fit": {"last_confirmed_at": due}}))
        self.assertTrue(needs_confirm({"fit": {"last_confirmed_at": due}}))

    def test_overlap_and_review_rules(self):
        self.assertTrue(dates_overlap(1, 5, 4, 8))
        self.assertFalse(dates_overlap(1, 5, 5, 8))
        self.assertTrue(review_allowed("viewing", "accepted"))
        self.assertFalse(review_allowed("viewing", "pending"))
        self.assertTrue(review_allowed("stay", "completed"))
        self.assertFalse(review_allowed("stay", "confirmed"))

    def test_only_provider_status_counts_as_paid(self):
        self.assertTrue(payment_confirmed("confirmed"))
        self.assertFalse(payment_confirmed("pending"))
        self.assertFalse(payment_confirmed("screenshot"))


if __name__ == "__main__":
    unittest.main()
