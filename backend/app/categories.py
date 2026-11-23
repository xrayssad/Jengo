"""Listing category ids. Rooms and houses share one id; old ids still match a query."""

ROOMS = "rooms-houses"
PLOTS = "plots"

LEGACY_ROOMS = {
    "chumba_nyumba",
    "rooms",
    "room",
    "houses",
    "house",
    "nyumba",
    "chumba",
    "vyumba",
    "vyumba_na_nyumba",
}
SHOPS = "store_godown"
LEGACY_SHOPS = {"frame", "frames", "fremu", "shop", "shops"}

ALLOWED = {ROOMS, "apartment_airbnb", SHOPS, PLOTS, "vifaa"}


def canonical_category(value: str | None) -> str:
    text = str(value or "").strip()
    if text in LEGACY_ROOMS:
        return ROOMS
    if text in LEGACY_SHOPS:
        return SHOPS
    return text


def expand_category_query(values: list[str]) -> list[str]:
    out: list[str] = []
    for value in values:
        canon = canonical_category(value)
        if canon and canon not in out:
            out.append(canon)
        extras = LEGACY_ROOMS if canon == ROOMS else LEGACY_SHOPS if canon == SHOPS else ()
        for old in extras:
            if old not in out:
                out.append(old)
    return out
