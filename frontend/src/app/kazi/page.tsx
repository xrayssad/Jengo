"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Hammer, MapPin, Plus } from "lucide-react";
import { fetchJobs, formatPrice, peekJobs, type Job } from "@/lib/api";
import { ListingFeedSkeleton } from "@/components/Skeletons";

function JobRow({ item, index }: { item: Job; index: number }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const photo = (item.images || []).find(Boolean);
  return (
    <Link href={`/kazi/${item.id}`} className={index < 8 ? "market-tile block card-enter" : "market-tile block"} style={index < 8 ? { animationDelay: `${index * 50}ms` } : undefined}>
      <div className="market-tile-media">
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <Hammer size={28} color="var(--primary)" />
          </div>
        )}
      </div>
      <div className="market-body">
        <p className="market-title">{item.title}</p>
        <p className="market-price"><span>TZS {formatPrice(item.budget)}</span></p>
        {place ? (
          <p className="market-place">
            <MapPin size={12} color="var(--muted)" aria-hidden />
            <span>{place}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function Page() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    const cached = peekJobs();
    if (!cached.length) return;
    setItems(cached);
    setLoading(false);
  }, []);

  useEffect(() => {
    let stop = false;
    fetchJobs("open")
      .then((res) => {
        if (!stop) {
          setItems(res.items || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load jobs");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-4">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="currentColor" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="page-title">Construction Jobs</h1>
            <p className="page-note">Paint, tiles, ceiling, plumbing, electrical, repairs</p>
          </div>
        </div>
      </header>

      <div className="canvas px-4 pt-6 space-y-4">
        <div className="estate-card">
          <div className="estate-card-media">
            <Image src="/real/materials.jpg" alt="" fill className="object-cover" sizes="720px" />
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[18px] font-bold leading-snug" style={{ color: "var(--ink)" }}>Small home jobs</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Customers post a job, workers send an offer. Jengo fee after you accept.</p>
          </div>
        </div>

        <Link href="/kazi/weka" className="btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm">
          <Plus size={18} strokeWidth={2.5} />
          Post a job
        </Link>

        {loading && items.length === 0 && <ListingFeedSkeleton count={4} />}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>{error}</p>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-12">
            <Hammer size={28} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>No open jobs</p>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Post a small job like paint or repairs.</p>
          </div>
        )}
        {items.length > 0 && (
          <div className="listing-grid mt-6">
            {items.map((item, index) => (
              <JobRow key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
