"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Hammer, Loader2 } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import ListingCard from "@/components/ListingCard";
import PosterName from "@/components/PosterName";
import { catLabel, fetchMyPosts, formatPrice, type Job, type Listing, type Reel } from "@/lib/api";
import { readIds } from "@/lib/mine";

type Row =
  | { kind: "listing"; at: string; item: Listing }
  | { kind: "reel"; at: string; item: Reel }
  | { kind: "job"; at: string; item: Job };

function stamp(value?: string) {
  return value || "";
}

function ReelPost({ item }: { item: Reel }) {
  return (
    <Link href="/reels" className="estate-card block overflow-hidden">
      <div className="relative" style={{ height: 220, backgroundColor: "var(--ink-2)" }}>
        {item.thumb_url ? (
          <img src={item.thumb_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Clapperboard size={28} color="var(--gold)" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,12,9,0.72), transparent 55%)" }} />
        <div className="absolute left-3 right-3 bottom-3">
          <PosterName item={item} tone="photo" />
          <p className="text-sm mt-1 truncate" style={{ color: "#FFF6ED" }}>{item.caption || "Reel"}</p>
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
      <div className="relative" style={{ height: 180, backgroundColor: "var(--ink-2)" }}>
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}>
            <Hammer size={28} color="var(--mocha)" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,12,9,0.55), transparent 50%)" }} />
        <div className="absolute left-3 right-3 bottom-3">
          <p className="text-[11px]" style={{ color: "var(--gold)" }}>Kazi za Ujenzi</p>
          <p className="font-heading text-lg leading-snug" style={{ color: "#FFF6ED" }}>{item.title}</p>
          {place ? <p className="text-xs mt-0.5" style={{ color: "rgba(255,246,237,0.8)" }}>{place}</p> : null}
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--ink)" }}>TSh {formatPrice(item.budget)}</p>
        <span className="text-[11px]" style={{ color: "var(--mocha)" }}>{item.status || "open"}</span>
      </div>
    </Link>
  );
}

export default function Page() {
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
        if (!stop) setError(err instanceof Error ? err.message : "Imeshindwa kupata post");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <AuthGate>
      <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
        <header className="sticky top-0 z-20 px-5 py-4 glass">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>My Posts</h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Nyumba, Airbnb, maduka, fremu, vifaa na reels</p>
            </div>
          </div>
        </header>
        <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin" color="var(--mocha)" />
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-16">
              <p className="font-heading" style={{ color: "var(--ink)" }}>{error}</p>
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="text-center py-16">
              <p className="font-heading text-2xl" style={{ color: "var(--ink)" }}>Huna post bado</p>
              <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Weka tangazo, reel au kazi ya ujenzi.</p>
              <div className="flex flex-col items-center gap-2 mt-4">
                <Link href="/weka-tangazo" className="btn-primary inline-block px-5 py-3 rounded-full text-sm font-semibold">Weka tangazo</Link>
                <Link href="/reels/new" className="text-sm" style={{ color: "var(--mocha)" }}>Weka reel</Link>
                <Link href="/kazi/weka" className="text-sm" style={{ color: "var(--mocha)" }}>Weka kazi ya ujenzi</Link>
              </div>
            </div>
          )}
          {rows.map((row) => {
            if (row.kind === "listing") {
              return (
                <div key={`listing-${row.item.id}`}>
                  <p className="text-[11px] mb-2" style={{ color: "var(--mocha)" }}>{catLabel[row.item.category || ""] || "Tangazo"}</p>
                  <ListingCard item={row.item} />
                </div>
              );
            }
            if (row.kind === "reel") {
              return (
                <div key={`reel-${row.item.id}`}>
                  <p className="text-[11px] mb-2" style={{ color: "var(--mocha)" }}>Reel</p>
                  <ReelPost item={row.item} />
                </div>
              );
            }
            return (
              <div key={`job-${row.item.id}`}>
                <p className="text-[11px] mb-2" style={{ color: "var(--mocha)" }}>Kazi za Ujenzi</p>
                <JobPost item={row.item} />
              </div>
            );
          })}
        </div>
      </main>
    </AuthGate>
  );
}
