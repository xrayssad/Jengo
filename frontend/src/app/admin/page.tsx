"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  catLabel,
  fetchAdminStats,
  formatPrice,
  periodLabel,
  type AdminStats,
  type Listing,
} from "@/lib/api";
import AuthGate from "@/components/AuthGate";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex-1 p-4 rounded-[18px]"
      style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#8B5E3C" }}>{label}</p>
      <p className="font-heading text-3xl mt-1" style={{ color: "#2E1A0F" }}>{value}</p>
    </div>
  );
}

function RecentRow({ item }: { item: Listing }) {
  return (
    <div
      className="p-4 rounded-[18px]"
      style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "#8B5E3C" }}>
        {catLabel[item.category || ""] || item.category || "Tangazo"}
      </p>
      <h2 className="font-bold mt-1" style={{ color: "#2E1A0F" }}>{item.title}</h2>
      <p className="text-sm mt-1" style={{ color: "#2E1A0F" }}>
        TZS {formatPrice(item.price)}{" "}
        <span style={{ color: "#5C4033" }}>{periodLabel(item.period)}</span>
      </p>
      {(item.location || item.city) && (
        <p className="text-xs mt-1" style={{ color: "#5C4033" }}>
          {[item.location, item.city].filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
}

function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const data = await fetchAdminStats();
        if (!stop) setStats(data);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Imeshindikana kupakia.");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5"
        style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
          >
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Admin</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Muhtasari wa akaunti na matangazo</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Inapakia...</p>}
        {error && <p className="text-sm text-center py-2 font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
        {stats && (
          <>
            <div className="flex gap-3">
              <StatCard label="Watumiaji" value={stats.users} />
              <StatCard label="Matangazo" value={stats.listings} />
            </div>
            <h2 className="font-heading text-base pt-2" style={{ color: "#2E1A0F" }}>Matangazo ya hivi karibuni</h2>
            {stats.recent.length === 0 ? (
              <p className="text-center py-10 font-bold" style={{ color: "#2E1A0F" }}>Hakuna matangazo bado</p>
            ) : (
              <div className="space-y-3">
                {stats.recent.map((item) => (
                  <RecentRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AuthGate admin>
      <AdminPanel />
    </AuthGate>
  );
}
