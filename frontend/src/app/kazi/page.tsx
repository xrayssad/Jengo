"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Hammer, MapPin, Plus } from "lucide-react";
import { fetchJobs, peekJobs, type Job } from "@/lib/api";
import { ListingFeedSkeleton } from "@/components/Skeletons";

function JobRow({ item }: { item: Job }) {
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
          <p className="font-heading text-[28px] leading-none post-caption">{item.title}</p>
          {place ? (
            <p className="flex items-center gap-1 mt-2 text-xs post-caption" style={{ opacity: 0.86 }}>
              <MapPin size={12} />
              {place}
            </p>
          ) : null}
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {item.deadline ? (
          <p className="text-sm" style={{ color: "var(--ink)" }}>Deadline {item.deadline}</p>
        ) : (
          <span />
        )}
        {item.offers_count ? (
          <span className="text-[11px]" style={{ color: "var(--mocha)" }}>{item.offers_count} offers</span>
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
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="page-title">Construction Jobs</h1>
            <p className="page-note">Paint, tiles, ceiling, plumbing, electrical, repairs</p>
          </div>
        </div>
      </header>

      <div className="canvas-read px-5 pt-6 space-y-5">
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

        {loading && items.length === 0 && <ListingFeedSkeleton count={2} wide />}
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
        {items.map((item) => (
          <JobRow key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
