"""Two accounts do not share preferences, and a home for sale is not stored as a plot."""

import unittest

from app.prefs import merge_preferences, sanitize_preferences
from app.pricing import clean_fit, quote_stay


class PreferenceTests(unittest.TestCase):
    def test_unknown_fields_are_dropped(self):
        saved = sanitize_preferences({"region": "Arusha", "language": "sw", "theme": "dark", "phone": "+255700000000", "user_id": "b"})
        self.assertEqual(saved, {"region": "Arusha", "language": "sw", "theme": "dark"})

    def test_merge_keeps_the_other_account_out(self):
        current = {"region": "Dar es Salaam", "language": "sw", "theme": "light"}
        merged = merge_preferences(current, {"theme": "dark"})
        self.assertEqual(merged["region"], "Dar es Salaam")
        self.assertEqual(merged["theme"], "dark")
        cleared = merge_preferences(current, {"region": ""})
        self.assertNotIn("region", cleared)
        self.assertEqual(cleared["language"], "sw")


class HomeDealTests(unittest.TestCase):
    def test_existing_home_without_a_type_stays_rent(self):
        fit = clean_fit("rooms-houses", {"bedrooms": 1, "room_type": "single"})
        self.assertEqual(fit["listing_type"], "rent")
        self.assertNotIn("plot_size", fit)

    def test_sale_home_keeps_sale_fields_and_skips_plot_math(self):
        fit = clean_fit(
            "rooms-houses",
            {
                "listing_type": "sale",
                "tenure": "gro",
                "documents": ["title", "nope"],
                "land_m2": 400,
                "built_m2": 120,
                "payment": "installments",
                "condition": "used",
                "room_type": "house",
            },
            price=85000000,
        )
        self.assertEqual(fit["listing_type"], "sale")
        self.assertEqual(fit["tenure"], "gro")
        self.assertEqual(fit["documents"], ["title"])
        self.assertEqual(fit["property_type"], "house")
        self.assertNotIn("price_per_m2", fit)
        quote = quote_stay("rooms-houses", 85000000, fit)
        self.assertEqual(quote["due"], 85000000)

    def test_rent_home_still_adds_the_move_in_total(self):
        fit = clean_fit("rooms-houses", {"listing_type": "rent", "months_advance": 2, "deposit": 100000})
        quote = quote_stay("rooms-houses", 100000, fit)
        self.assertGreater(quote["due"], 100000)

    def test_sale_home_does_not_demand_an_agent_fee(self):
        fit = clean_fit("rooms-houses", {"listing_type": "sale", "poster_role": "agent"}, price=1000)
        self.assertEqual(fit["listing_type"], "sale")
        self.assertEqual(fit["agent_fee"], 0)

    def test_plot_sale_is_unchanged(self):
        fit = clean_fit("plots", {"listing_type": "lease", "plot_size": 500, "plot_unit": "m2"}, price=5000000)
        self.assertEqual(fit["listing_type"], "lease")
        self.assertEqual(fit["size_m2"], 500)


if __name__ == "__main__":
    unittest.main()
