"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clapperboard, Hammer } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import ListingCard from "@/components/ListingCard";
import PosterName from "@/components/PosterName";
import { ListingFeedSkeleton } from "@/components/Skeletons";
import { deleteMyListing, fetchMyPosts, setMyListingStatus, type Job, type Listing, type Reel } from "@/lib/api";
import SwipeRow from "@/components/SwipeRow";
import { photoMinimum } from "@/lib/categories.config";
import { useT } from "@/lib/i18n";
import { readFit } from "@/lib/pricing";
import { readIds } from "@/lib/mine";

type Row =
  | { kind: "listing"; at: string; item: Listing }
  | { kind: "reel"; at: string; item: Reel }
  | { kind: "job"; at: string; item: Job };

type Block =
  | { kind: "listings"; key: string; items: Listing[] }
  | { kind: "reel"; key: string; item: Reel }
  | { kind: "job"; key: string; item: Job };

function groupRows(rows: Row[]): Block[] {
  const blocks: Block[] = [];
  for (const row of rows) {
    if (row.kind === "listing") {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "listings") last.items.push(row.item);
      else blocks.push({ kind: "listings", key: row.item.id, items: [row.item] });
      continue;
    }
    if (row.kind === "reel") {
      blocks.push({ kind: "reel", key: row.item.id, item: row.item });
      continue;
    }
    blocks.push({ kind: "job", key: row.item.id, item: row.item });
  }
  return blocks;
}

function stamp(value?: string) {
  return value || "";
}

function ReelPost({ item }: { item: Reel }) {
  return (
    <Link href="/reels" className="estate-card block overflow-hidden">
      <div className="post-frame" style={{ backgroundColor: "var(--ink-2)" }}>
        {item.thumb_url ? (
          <img src={item.thumb_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Clapperboard size={28} color="var(--gold)" />
          </div>
        )}
        <div className="post-scrim" />
        <div className="absolute left-4 right-4 bottom-4">
          <PosterName item={item} tone="photo" />
          <p className="text-sm mt-1 truncate post-caption">{item.caption || "Reel"}</p>
        </div>
      </div>
    </Link>
  );
}

function JobPost({ item }: { item: Job }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const photo = (item.images || []).find(Boolean);
  return (
    <Link href={`/kazi/${item.id}`} className="estate-card block overflow-hidden">
      <div className="post-frame" style={{ backgroundColor: "var(--ink-2)" }}>
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}>
            <Hammer size={28} color="var(--mocha)" />
          </div>
        )}
        <div className="post-scrim" />
        <div className="absolute left-4 right-4 bottom-4">
          <p className="text-[11px]" style={{ color: "var(--gold)" }}>Construction Jobs</p>
          <p className="text-[16px] font-semibold leading-tight post-caption">{item.title}</p>
          {place ? <p className="text-xs mt-1 post-caption" style={{ opacity: 0.86 }}>{place}</p> : null}
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        {item.deadline ? (
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Deadline {item.deadline}</p>
        ) : (
          <span />
        )}
        <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ color: "var(--mocha)", background: "rgba(var(--caramel-rgb),0.18)" }}>{item.status || "open"}</span>
      </div>
    </Link>
  );
}

function health(item: Listing, label: (key: string) => string) {
  const fit = readFit(item);
  const tips: string[] = [];
  if ((item.images || []).length < photoMinimum(item.category)) tips.push(label("fit.health.photos"));
  if (!fit.costs_confirmed) tips.push(label("fit.health.costs"));
  if (item.lat == null && !fit.landmark) tips.push(label("fit.health.pin"));
  if (fit.last_confirmed_at) {
    const age = Date.now() - Date.parse(fit.last_confirmed_at);
    if (Number.isFinite(age) && age > 14 * 86400000) tips.push(label("fit.health.confirm"));
  }
  return tips;
}

export default function Page() {
  const t = useT();
  const router = useRouter();
  const undoRef = useRef<(() => void) | null>(null);
  const timer = useRef(0);
  const [toast, setToast] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const data = await fetchMyPosts(readIds());
        if (data.skipped?.length) {
          console.warn("Jengo my posts skipped", data.skipped);
        }
        const next: Row[] = [];
        for (const item of data.listings || []) {
          next.push({ kind: "listing", at: stamp(item.created_at), item });
        }
        for (const item of data.reels || []) {
          next.push({ kind: "reel", at: stamp(item.created_at), item });
        }
        for (const item of data.jobs || []) {
          next.push({ kind: "job", at: stamp(item.created_at), item });
        }
        next.sort((a, b) => b.at.localeCompare(a.at));
        if (!stop) {
          setRows(next);
          setError("");
        }
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load posts");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    const onView = (event: Event) => {
      const detail = (event as CustomEvent).detail as { id?: string; views_count?: number };
      if (!detail?.id || typeof detail.views_count !== "number") return;
      setRows((cur) => cur.map((row) => (
        row.kind === "listing" && row.item.id === detail.id
          ? { ...row, item: { ...row.item, views_count: detail.views_count, views: detail.views_count } }
          : row
      )));
    };
    window.addEventListener("jengo-views", onView);
    return () => window.removeEventListener("jengo-views", onView);
  }, []);

  const askUndo = (message: string, undo: () => void, commit: () => void) => {
    window.clearTimeout(timer.current);
    undoRef.current = () => {
      undo();
      undoRef.current = null;
    };
    setToast(message);
    timer.current = window.setTimeout(() => {
      setToast("");
      undoRef.current = null;
      commit();
    }, 5000);
  };

  const pause = (item: Listing) => {
    const next = item.status === "hidden" ? "active" : "hidden";
    const prev = item.status || "active";
    setRows((cur) => cur.map((row) => (row.kind === "listing" && row.item.id === item.id ? { ...row, item: { ...row.item, status: next } } : row)));
    void setMyListingStatus(item.id, next).catch(() => {
      setRows((cur) => cur.map((row) => (row.kind === "listing" && row.item.id === item.id ? { ...row, item: { ...row.item, status: prev } } : row)));
    });
  };

  const remove = (item: Listing) => {
    let snapshot: Row[] = [];
    setRows((cur) => {
      snapshot = cur;
      return cur.filter((row) => !(row.kind === "listing" && row.item.id === item.id));
    });
    askUndo(t("mine.deleted"), () => setRows(snapshot), () => {
      void deleteMyListing(item.id).catch(() => setRows(snapshot));
    });
  };

  return (
    <AuthGate>
      <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas flex items-center gap-3 px-5">
            <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div className="min-w-0">
              <h1 className="page-title">My Posts</h1>
              <p className="page-note">Rooms, Airbnb, shops, frames, materials and reels</p>
            </div>
          </div>
        </header>
        <div className="canvas px-4 pt-6 space-y-5">
          {loading && <ListingFeedSkeleton />}
          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>{error}</p>
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="text-center py-16">
              <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>No posts yet</p>
              <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Post a listing, reel or construction job.</p>
              <div className="flex flex-col items-center gap-2 mt-4">
                <Link href="/weka-tangazo" className="btn-primary inline-block px-5 py-3 rounded-full text-sm font-semibold">Post a listing</Link>
                <Link href="/reels/new" className="text-sm" style={{ color: "var(--mocha)" }}>Post a reel</Link>
                <Link href="/kazi/weka" className="text-sm" style={{ color: "var(--mocha)" }}>Post a construction job</Link>
              </div>
            </div>
          )}
          {groupRows(rows).map((block) => {
            if (block.kind === "listings") {
              return (
                <div key={`listings-${block.key}`} className="listing-grid">
                  {block.items.map((item, i) => (
                    <SwipeRow
                      key={item.id}
                      actions={[
                        { id: "edit", label: t("mine.edit"), onClick: () => router.push(`/tangazo/${item.id}`) },
                        { id: "pause", label: item.status === "hidden" ? t("mine.resume") : t("mine.pause"), onClick: () => pause(item) },
                        { id: "delete", label: t("mine.delete"), tone: "danger", onClick: () => remove(item) },
                      ]}
                    >
                      <div>
                        {item.status ? <span className="status-chip">{t(`status.${item.status}`)}</span> : null}
                        <ListingCard item={item} eager={i < 2} delay={i < 8 ? i * 50 : -1} defer={i >= 6} />
                        {health(item, t).map((tip) => <p key={tip} className="fit-note">{tip}</p>)}
                      </div>
                    </SwipeRow>
                  ))}
                </div>
              );
            }
            if (block.kind === "reel") {
              return (
                <div key={`reel-${block.key}`}>
                  <p className="text-[11px] mb-2" style={{ color: "var(--mocha)" }}>Reel</p>
                  <ReelPost item={block.item} />
                </div>
              );
            }
            return (
              <div key={`job-${block.key}`}>
                <p className="text-[11px] mb-2" style={{ color: "var(--mocha)" }}>Construction Jobs</p>
                <JobPost item={block.item} />
              </div>
            );
          })}
        </div>
        {toast ? (
          <div className="undo-toast" role="status">
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => {
                window.clearTimeout(timer.current);
                undoRef.current?.();
                setToast("");
              }}
            >
              {t("mine.undo")}
            </button>
          </div>
        ) : null}
      </main>
    </AuthGate>
  );
}
