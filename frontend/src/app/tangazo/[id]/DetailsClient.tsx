"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ViewTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { motionDur, moveSpring, usePrefersReducedMotion } from "@/lib/motion";
import {
  catLabel,
  catShort,
  fetchListing,
  formatPrice,
  peekListing,
  listingPhones,
  listingUnit,
  periodLabel,
  phoneTelHref,
  timeAgo,
  unitLabel,
  type Listing,
} from "@/lib/api";
import { useT } from "@/lib/i18n";
import { listingHref, markMissing, moveBrowse, readFrozen, setBrowseDir, takeBrowseDir } from "@/lib/listSession";
import SaveButton from "@/components/SaveButton";
import SocialActions from "@/components/SocialActions";
import PhotoGallery from "@/components/PhotoGallery";
import PosterName from "@/components/PosterName";
import { DetailSkeleton } from "@/components/Skeletons";

function shownPlace(location?: string | null, city?: string | null) {
  const parts = [location, city]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    const prev = unique[unique.length - 1];
    if (prev && prev.toLowerCase() === part.toLowerCase()) continue;
    unique.push(part);
  }
  return unique.join(", ") || "—";
}

export default function DetailsClient({ id: routeId, overlay = false }: { id: string; overlay?: boolean }) {
  const [id, setId] = useState(routeId);
  const router = useRouter();
  const from = useSearchParams().get("from");
  const t = useT();
  const vtName = from === "hero" || from === "rail" ? `listing-${from}-${id}` : `listing-${id}`;
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gone, setGone] = useState(false);
  const [qty, setQty] = useState("1");
  const [sent, setSent] = useState(false);
  const [browseReady, setBrowseReady] = useState(false);
  const [rev, setRev] = useState(0);
  const swapHolder = useRef({ id: "", dir: "" as "" | "next" | "prev" });
  if (swapHolder.current.id !== id) {
    const dir = takeBrowseDir();
    swapHolder.current = { id, dir: dir === "next" || dir === "prev" ? dir : "" };
  }
  const swap = swapHolder.current.dir;
  const reduce = usePrefersReducedMotion();

  useLayoutEffect(() => {
    setId(routeId);
  }, [routeId]);

  useEffect(() => {
    setBrowseReady(true);
  }, []);

  useEffect(() => {
    setQty("1");
    setSent(false);
  }, [id]);

  useLayoutEffect(() => {
    const cached = peekListing(id);
    setGone(false);
    setError("");
    if (cached) {
      setItem(cached);
      setLoading(false);
    } else {
      setItem(null);
      setLoading(true);
    }
    if (overlay) {
      const node = document.querySelector(".detail-overlay");
      if (node instanceof HTMLElement) node.scrollTop = 0;
      return;
    }
    window.scrollTo(0, 0);
  }, [id, overlay]);

  useEffect(() => {
    let stop = false;
    const cached = peekListing(id);
    if (!cached) setLoading(true);
    (async () => {
      try {
        const data = await fetchListing(id);
        if (!stop) {
          setItem(data);
          setError("");
        }
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (!stop && (status === 404 || status === 410)) {
          setGone(true);
          setItem(null);
          setError("");
          markMissing(id);
          setRev((n) => n + 1);
        } else if (!stop && !cached) setError(e instanceof Error ? e.message : "Not available");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [id]);

  const phones = item ? listingPhones(item) : [];
  const callHref = phones[0] ? phoneTelHref(phones[0]) : "";
  const ago = item ? timeAgo(item.created_at) : "";
  const place = shownPlace(item?.location, item?.city);

  const specs = item
    ? [
        {
          label: "Type",
          value: catShort[item.category || ""] || catLabel[item.category || ""] || "—",
        },
        {
          label: item.category === "vifaa" ? "Unit" : "Period",
          value:
            item.category === "vifaa"
              ? unitLabel(listingUnit(item)) || "—"
              : (periodLabel(item.period) || "—").replace(/^\//, "") || "—",
        },
        item.category === "vifaa" && item.stock != null
          ? { label: "Stock", value: String(item.stock) }
          : { label: "Status", value: "Open" },
        item.city || item.location
          ? { label: "Area", value: item.city || String(item.location || "").split(",")[0] || "—" }
          : { label: "Photos", value: String((item.images || []).filter(Boolean).length || 0) },
      ]
    : [];

  const description =
    item &&
    (phones.length
      ? item.description?.replace(/\n*(?:Simu|Phone):\s*.+$/m, "").trim()
      : item.description?.trim());

  const frozen = useMemo(() => (browseReady ? readFrozen() : null), [browseReady, id, rev]);
  const inContext = Boolean(frozen && frozen.ids.includes(id));

  const neighbor = (dir: 1 | -1) => {
    const current = readFrozen();
    if (!current || !current.ids.includes(id)) return null;
    const missing = new Set(current.missing);
    let index = current.ids.indexOf(id);
    while (true) {
      index += dir;
      if (index < 0 || index >= current.ids.length) return null;
      const next = current.ids[index];
      if (!missing.has(next)) return next;
    }
  };

  const prevId = inContext ? neighbor(-1) : null;
  const nextId = inContext ? neighbor(1) : null;

  const go = (nextId: string, dir: 1 | -1) => {
    const source = readFrozen()?.source || "feed";
    if (!reduce) setBrowseDir(dir > 0 ? "next" : "prev");
    moveBrowse(nextId);
    const href = listingHref(nextId, source);
    if (overlay) {
      setId(nextId);
      window.history.replaceState(window.history.state, "", href);
      return;
    }
    router.replace(href, { scroll: false });
  };

  const close = () => {
    if (overlay) router.back();
    else router.push("/home");
  };

  useEffect(() => {
    if (!inContext) return;
    const card = document.querySelector<HTMLElement>(".more-card.is-on");
    const scroller = card?.parentElement;
    if (card && scroller) {
      const left = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, left) });
    }
    const near = [prevId, nextId].filter((value): value is string => Boolean(value));
    let stop = false;
    const images: HTMLImageElement[] = [];
    for (const nearId of near) {
      void (async () => {
        let row = peekListing(nearId);
        if (!row) {
          try {
            row = await fetchListing(nearId);
          } catch (err) {
            const status = (err as { status?: number }).status;
            if (status === 404 || status === 410) {
              markMissing(nearId);
              setRev((n) => n + 1);
            }
            return;
          }
        }
        if (stop || !row) return;
        setRev((n) => n + 1);
        const src = (row.images || []).find(Boolean);
        if (!src) return;
        const img = new Image();
        img.src = src;
        images.push(img);
      })();
    }
    return () => {
      stop = true;
      for (const img of images) img.src = "";
    };
  }, [inContext, prevId, nextId]);

  return (
    <main key={id} className={`detail-page min-h-screen${swap ? ` is-swap-${swap}` : ""}${inContext && (frozen?.ids.length || 0) > 1 ? " has-rail" : ""}`}>
      {loading && <DetailSkeleton />}
      {!loading && error && (
        <div className="text-center py-16 px-5">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--error)" }}>{error}</p>
          <button type="button" onClick={close} className="text-sm font-semibold" style={{ color: "var(--mocha)" }}>
            {t("back")}
          </button>
        </div>
      )}
      {!loading && gone && (
        <div className="detail-gone">
          <button type="button" onClick={close} className="detail-float-btn detail-back" aria-label={t("back")}>
            <ArrowLeft size={18} color="currentColor" />
          </button>
          {prevId ? (
            <button type="button" className="detail-step detail-step-prev" aria-label={t("prevListing")} onClick={() => go(prevId, -1)}>
              <ChevronLeft size={18} />
            </button>
          ) : null}
          {nextId ? (
            <button type="button" className="detail-step detail-step-next" aria-label={t("nextListing")} onClick={() => go(nextId, 1)}>
              <ChevronRight size={18} />
            </button>
          ) : null}
          <p>{t("gone")}</p>
        </div>
      )}
      {!loading && item && !gone && (
        <>
          <div className="relative">
            <ViewTransition name={vtName} share="listing-morph" default="none">
            <PhotoGallery
              key={id}
              images={item.images}
              onEdge={(dir) => {
                const next = neighbor(dir);
                if (next) go(next, dir);
              }}
              fallback={
                <div
                  className="w-full flex items-center justify-center detail-hero-fallback"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span className="text-2xl font-semibold" style={{ color: "var(--primary)" }}>
                    {catShort[item.category || ""] || "Jengo"}
                  </span>
                </div>
              }
            />
            </ViewTransition>
            <button
              type="button"
              onClick={close}
              className="detail-float-btn detail-back"
              aria-label={t("back")}
            >
              <ArrowLeft size={18} color="currentColor" />
            </button>
            {prevId ? (
              <button type="button" className="detail-step detail-step-prev" aria-label={t("prevListing")} onClick={() => go(prevId, -1)}>
                <ChevronLeft size={18} />
              </button>
            ) : null}
            {nextId ? (
              <button type="button" className="detail-step detail-step-next" aria-label={t("nextListing")} onClick={() => go(nextId, 1)}>
                <ChevronRight size={18} />
              </button>
            ) : null}
            <div className="detail-float-row">
              <button
                type="button"
                className="detail-float-btn"
                aria-label="Share"
                onClick={() => {
                  const url = `${window.location.origin}/tangazo/${item.id}`;
                  const data = { title: item.title, url };
                  if (navigator.share) {
                    navigator.share(data).catch(() => {});
                    return;
                  }
                  navigator.clipboard?.writeText(url).catch(() => {});
                }}
              >
                <Share2 size={16} />
              </button>
              <SaveButton item={item} variant="heart" size={18} className="detail-float-btn" />
            </div>
          </div>

          <motion.div
            className="detail-sheet canvas-read px-4 pt-5"
            initial={reduce ? false : { y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={reduce ? { duration: motionDur.fast } : moveSpring}
          >
            <ViewTransition enter="detail-copy" default="none">
            <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="detail-price">
                  TZS {formatPrice(item.price)}
                  <span className="detail-unit">
                    {item.category === "vifaa"
                      ? listingUnit(item)
                        ? `/ ${unitLabel(listingUnit(item))}`
                        : ""
                      : periodLabel(item.period)}
                  </span>
                </p>
                <p className="detail-place">
                  <MapPin size={14} color="var(--muted)" />
                  <span>{place}</span>
                </p>
              </div>
              {ago ? <span className="time-pill shrink-0">{ago}</span> : null}
            </div>

            <h1 className="detail-title">{item.title}</h1>
            <p className="detail-accent">{catLabel[item.category || ""] || catShort[item.category || ""] || ""}</p>
            </div>
            </ViewTransition>
            <div className="seller-card">
              <PosterName item={item} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {specs.map((spec) => (
                <div key={spec.label} className="stat-pill">
                  <p className="stat-pill-label">{spec.label}</p>
                  <p className="stat-pill-value">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <SocialActions item={item} />
            </div>

            <div className="mt-6">
              <p className="detail-heading">Listing information</p>
              <p className="detail-copy whitespace-pre-wrap">
                {description || "No extra description."}
              </p>
            </div>

            {item.category === "vifaa" && (
              <div className="mt-5">
                <label className="detail-qty-label">Quantity</label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                  className="detail-qty w-full px-4 text-sm"
                />
              </div>
            )}
          </motion.div>

          <div className="detail-cta-bar">
            <div className="detail-cta-row">
              {callHref ? (
                <a href={callHref} className="detail-cta">
                  <Phone size={16} />
                  Call
                </a>
              ) : (
                <Link
                  href={`/tuma-ombi?listing=${item.id}&title=${encodeURIComponent(item.title)}&category=${encodeURIComponent(item.category || "")}&qty=${encodeURIComponent(qty)}`}
                  className="detail-cta"
                >
                  <Phone size={16} />
                  Request
                </Link>
              )}
              <Link
                href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`}
                className={sent ? "detail-cta detail-cta-secondary is-sent" : "detail-cta detail-cta-secondary"}
                onClick={(event) => {
                  if (reduce || sent) return;
                  event.preventDefault();
                  setSent(true);
                  const href = `/chat/${item.id}?title=${encodeURIComponent(item.title)}`;
                  window.setTimeout(() => router.push(href), 1200);
                }}
              >
                {sent ? <Check size={16} /> : <Mail size={16} />}
                {sent ? "Sent" : "Message"}
              </Link>
            </div>
          </div>
        </>
      )}
      {inContext && frozen && frozen.ids.length > 1 ? (
        <div className="more-rail">
          <p className="more-rail-label">{t("moreList")}</p>
          <div className="more-rail-scroller no-scrollbar">
            {frozen.ids.map((rowId) => {
              const row = peekListing(rowId);
              const src = (row?.images || []).find(Boolean) || "";
              const missing = frozen.missing.includes(rowId);
              return (
                <button
                  key={rowId}
                  type="button"
                  className={rowId === id ? "more-card is-on" : "more-card"}
                  aria-current={rowId === id ? "true" : undefined}
                  disabled={missing}
                  onClick={() => {
                    if (rowId === id || missing) return;
                    go(rowId, frozen.ids.indexOf(rowId) > frozen.ids.indexOf(id) ? 1 : -1);
                  }}
                >
                  {src ? <img src={src} alt="" /> : <span>{(row?.title || "·").slice(0, 1)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </main>
  );
}
