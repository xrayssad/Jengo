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

ALLOWED = {ROOMS, "apartment_airbnb", "store_godown", "frame", PLOTS, "vifaa"}


def canonical_category(value: str | None) -> str:
    text = str(value or "").strip()
    if text in LEGACY_ROOMS:
        return ROOMS
    return text


def expand_category_query(values: list[str]) -> list[str]:
    out: list[str] = []
    for value in values:
        canon = canonical_category(value)
        if canon and canon not in out:
            out.append(canon)
        if canon == ROOMS:
            for old in LEGACY_ROOMS:
                if old not in out:
                    out.append(old)
    return out
