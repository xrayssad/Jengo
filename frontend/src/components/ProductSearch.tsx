"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { formatPrice, periodLabel, type Listing } from "@/lib/api";
import { REGIONS } from "@/lib/browse";
import { CATEGORIES } from "@/lib/categories.config";
import { useI18n } from "@/lib/i18n";
import {
  POPULAR_SEARCHES,
  clearRecent,
  completionsFor,
  highlightTitle,
  matchCategories,
  matchRegion,
  rankListings,
  readRecent,
  rememberSearch,
  removeRecent,
  wantsNear,
} from "@/lib/productSearch";

type Option =
  | { key: string; kind: "recent" | "popular" | "completion"; label: string }
  | { key: string; kind: "listing"; label: string; item: Listing }
  | { key: string; kind: "category"; label: string }
  | { key: string; kind: "region"; label: string; region: string }
  | { key: string; kind: "near"; label: string };

export default function ProductSearch({
  query,
  listings,
  loading = false,
  onSearch,
  onRegion,
}: {
  query: string;
  listings: Listing[];
  loading?: boolean;
  onSearch: (next: string) => void;
  onRegion: (region: string) => void;
}) {
  const { t, lang } = useI18n();
  const listId = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const [debounced, setDebounced] = useState(query.trim());
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [moved, setMoved] = useState(false);

  const categories = useMemo(
    () => Object.values(CATEGORIES).map((item) => ({ id: item.id, label: lang === "sw" ? item.sw : item.en, match: `${item.en} ${item.sw}` })),
    [lang],
  );

  useEffect(() => {
    const openSearch = () => {
      setDraft(query);
      setDebounced(query.trim());
      setRecent(readRecent());
      setOpen(true);
    };
    window.addEventListener("jengo-open-search", openSearch);
    return () => window.removeEventListener("jengo-open-search", openSearch);
  }, [query]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(draft.trim()), 200);
    return () => window.clearTimeout(id);
  }, [draft]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.searchOverlay = "1";
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => field.current?.focus());
    if (!window.history.state?.jengoSearch) {
      window.history.pushState({ ...(window.history.state || {}), jengoSearch: 1 }, "");
    }
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", onPop);
      delete document.documentElement.dataset.searchOverlay;
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => {
    if (window.history.state?.jengoSearch) window.history.back();
    else setOpen(false);
    window.requestAnimationFrame(() => opener.current?.focus());
  };

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) return;
    setRecent(rememberSearch(next));
    onSearch(next);
    close();
  };

  const options = useMemo<Option[]>(() => {
    if (!debounced) {
      return [
        ...recent.map((label) => ({ key: `recent:${label}`, kind: "recent" as const, label })),
        ...POPULAR_SEARCHES.map((label) => ({ key: `popular:${label}`, kind: "popular" as const, label })),
      ];
    }
    const ranked = rankListings(listings, debounced, {
      categories: categories.map((item) => ({ id: item.id, label: item.match })),
    });
    const found = [...ranked.exact, ...ranked.related].slice(0, 5);
    const cats = matchCategories(debounced, categories.map((item) => ({ id: item.id, label: item.match })))
      .map((hit) => categories.find((item) => item.id === hit.id))
      .filter((item): item is (typeof categories)[number] => Boolean(item));
    const region = matchRegion(debounced, REGIONS);
    const near = wantsNear(debounced);
    const rows: Option[] = [
      ...found.map((item) => ({ key: `listing:${item.id}`, kind: "listing" as const, label: item.title, item })),
      ...cats.map((item) => ({ key: `cat:${item.id}`, kind: "category" as const, label: item.label })),
    ];
    if (region) rows.push({ key: `region:${region}`, kind: "region", label: region, region });
    if (near) rows.push({ key: "near", kind: "near", label: t("near") });
    for (const label of completionsFor(debounced)) {
      rows.push({ key: `done:${label}`, kind: "completion", label });
    }
    return rows;
  }, [categories, debounced, listings, recent, t]);

  useEffect(() => {
    setActive(0);
    setMoved(false);
  }, [debounced, open]);

  const choose = (option: Option) => {
    if (option.kind === "region") {
      onSearch("");
      onRegion(option.region);
      close();
      return;
    }
    if (option.kind === "near") {
      onSearch("");
      onRegion("near");
      close();
      return;
    }
    submit(option.label);
  };

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMoved(true);
      setActive((cur) => (options.length ? (cur + 1) % options.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMoved(true);
      setActive((cur) => (options.length ? (cur - 1 + options.length) % options.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = options[active];
      if (moved && option) {
        choose(option);
        return;
      }
      submit(draft);
    }
  };

  const showRecent = open && !debounced && recent.length > 0;
  const showPopular = open && !debounced;
  let cursor = -1;

  return (
    <>
      <div className="home-search-row">
        <div className="search-field home-search">
          <button
            ref={opener}
            type="button"
            className="home-search-open"
            onClick={() => {
              setDraft(query);
              setDebounced(query.trim());
              setRecent(readRecent());
              setOpen(true);
            }}
          >
            <Search size={18} color="var(--muted)" aria-hidden />
            <span className={query ? "home-search-value" : "home-search-hint"}>{query || t("search.placeholder")}</span>
          </button>
          {query ? (
            <button type="button" className="search-clear" aria-label={t("search.clear")} onClick={() => onSearch("")}>
              <X size={16} />
            </button>
          ) : null}
          <Link href="/search" className="home-filter" aria-label={t("search.filters")}>
            <SlidersHorizontal size={18} color="currentColor" />
          </Link>
        </div>
      </div>
      {open ? (
        <div className="search-overlay" role="presentation">
          <div className="search-overlay-bar">
            <div className="search-field home-search" role="combobox" aria-expanded="true" aria-controls={listId} aria-haspopup="listbox">
              <Search size={18} color="var(--muted)" aria-hidden />
              <input
                ref={field}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKey}
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
                inputMode="search"
                enterKeyHint="search"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {draft ? (
                <button type="button" className="search-clear" aria-label={t("search.clear")} onClick={() => setDraft("")}>
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <button type="button" className="search-cancel" onClick={close}>{t("close")}</button>
          </div>
          <div className="search-overlay-body">
            {loading && listings.length === 0 ? (
              <div className="search-skel" aria-hidden>
                <span /><span /><span />
              </div>
            ) : null}
            {!loading && listings.length === 0 && debounced ? (
              <p className="search-quiet">{t("search.offline")}</p>
            ) : null}
            <ul id={listId} role="listbox" aria-label={t("search.placeholder")} className="search-options">
              {showRecent ? <li className="search-label" role="presentation">{t("search.recent")}</li> : null}
              {options.map((option, index) => {
                cursor += 1;
                const at = cursor;
                const heading = option.kind === "popular" && (index === 0 || options[index - 1]?.kind === "recent");
                const group = option.kind === "listing" && options[index - 1]?.kind !== "listing"
                  ? t("search.listings")
                  : option.kind === "category" && options[index - 1]?.kind !== "category"
                    ? t("search.categories")
                    : option.kind === "region" || option.kind === "near"
                      ? options[index - 1]?.kind === "region" || options[index - 1]?.kind === "near" ? "" : t("search.places")
                      : option.kind === "completion" && options[index - 1]?.kind !== "completion"
                        ? t("search.try")
                        : "";
                return (
                  <li key={option.key} role="presentation">
                    {heading ? <p className="search-label">{t("search.popular")}</p> : null}
                    {group ? <p className="search-label">{group}</p> : null}
                    {option.kind === "recent" ? (
                      <div className={at === active ? "search-option is-on" : "search-option"} role="option" id={`${listId}-${at}`} aria-selected={at === active}>
                        <button type="button" onClick={() => choose(option)}>{option.label}</button>
                        <button
                          type="button"
                          className="search-clear"
                          aria-label={t("search.remove")}
                          onClick={() => setRecent(removeRecent(option.label))}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : option.kind === "listing" ? (
                      <button type="button" className={at === active ? "search-option is-on" : "search-option"} role="option" id={`${listId}-${at}`} aria-selected={at === active} onClick={() => choose(option)}>
                        <span className="search-thumb">
                          {option.item.images?.[0] ? <img src={option.item.images[0]} alt="" /> : null}
                        </span>
                        <span className="search-copy">
                          <span className="search-title">
                            {highlightTitle(option.item.title, debounced).map((part, partIndex) => (
                              part.mark ? <mark key={partIndex}>{part.text}</mark> : <span key={partIndex}>{part.text}</span>
                            ))}
                          </span>
                          <span className="search-meta">TSh {formatPrice(option.item.price || 0)}{periodLabel(option.item.period) ? ` ${periodLabel(option.item.period)}` : ""} · {option.item.city || option.item.location?.split(",")[0] || ""}</span>
                        </span>
                      </button>
                    ) : (
                      <button type="button" className={at === active ? "search-option is-on" : "search-option"} role="option" id={`${listId}-${at}`} aria-selected={at === active} onClick={() => choose(option)}>
                        {option.kind === "region" ? t("search.area", { name: option.label }) : option.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {showRecent ? (
              <button type="button" className="search-clear-all" onClick={() => setRecent(clearRecent())}>{t("search.clearAll")}</button>
            ) : null}
            {showPopular ? null : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
