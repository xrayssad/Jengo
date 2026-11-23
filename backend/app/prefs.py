"""Per-user preferences. The user id always comes from the session, never the body."""

from __future__ import annotations

_LANG = {"en", "sw"}
_THEME = {"light", "dark", "system"}


def sanitize_preferences(raw: dict | None) -> dict:
    src = raw if isinstance(raw, dict) else {}
    out: dict = {}
    region = str(src.get("region") or "").strip()[:80]
    if region and region not in {"all", "near"}:
        out["region"] = region
    language = str(src.get("language") or "").strip()
    if language in _LANG:
        out["language"] = language
    theme = str(src.get("theme") or "").strip()
    if theme in _THEME:
        out["theme"] = theme
    if isinstance(src.get("notifications"), bool):
        out["notifications"] = src["notifications"]
    return out


def merge_preferences(current: dict | None, patch: dict | None) -> dict:
    src = dict(current or {})
    incoming = patch or {}
    for key in ("region", "language", "theme", "notifications"):
        if key in incoming:
            src[key] = incoming[key]
    return sanitize_preferences(src)
