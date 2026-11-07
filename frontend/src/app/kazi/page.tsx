"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Hammer, MapPin, Plus } from "lucide-react";
import { fetchJobs, type Job } from "@/lib/api";
import { ListingFeedSkeleton } from "@/components/Skeletons";

function JobRow({ item }: { item: Job }) {
  const place = [item.location, item.city].filter(Boolean).join(", ");
  const photo = (item.images || []).find(Boolean);
  return (
    <Link href={`/kazi/${item.id}`} className="estate-card block overflow-hidden">
      <div className="relative" style={{ height: 168, backgroundColor: "var(--ink-2)" }}>
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(165deg, var(--blush), var(--cream))" }}>
            <Hammer size={28} color="var(--mocha)" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,12,9,0.5), transparent 55%)" }} />
        <div className="absolute left-3 right-3 bottom-3">
          <p className="font-heading text-xl leading-snug" style={{ color: "#FFF6ED" }}>{item.title}</p>
          {place ? (
            <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: "rgba(255,246,237,0.82)" }}>
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
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Construction Jobs</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Paint, tiles, ceiling, plumbing, electrical, repairs</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        <div className="estate-card">
          <div className="relative" style={{ height: 168 }}>
            <Image src="/real/materials.jpg" alt="" fill className="object-cover" sizes="400px" />
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

        {loading && <ListingFeedSkeleton count={2} />}
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
