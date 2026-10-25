"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import {
  catLabel,
  fetchListings,
  formatPrice,
  periodLabel,
  setListingStatus,
  type Listing,
} from "@/lib/api";
import AuthGate from "@/components/AuthGate";

export default function AdminReviewPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await fetchListings({ status: "pending" });
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kupakia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, status: "active" | "rejected") => {
    setBusyId(id);
    setError("");
    try {
      await setListingStatus(id, status);
      setItems((cur) => cur.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kubadilisha hali.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AuthGate admin>
    <main className="min-h-screen pb-24 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
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
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Hakiki matangazo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Chapisha au kataa kabla ya kuonekana</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {loading && <p className="text-center py-10" style={{ color: "#5C4033" }}>Inapakia...</p>}
        {error && (
          <p className="text-sm text-center py-2 font-semibold" style={{ color: "#A6452E" }}>{error}</p>
        )}
        {!loading && items.length === 0 && !error && (
          <p className="text-center py-16 font-bold" style={{ color: "#2E1A0F" }}>Hakuna tangazo linalosubiri</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
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
            {item.description && (
              <p className="text-sm mt-2" style={{ color: "#5C4033" }}>{item.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => decide(item.id, "active")}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold"
                style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED", opacity: busyId === item.id ? 0.7 : 1 }}
              >
                <Check size={16} /> Chapisha
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => decide(item.id, "rejected")}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[14px] text-sm font-semibold"
                style={{ border: "1.5px solid #3D2415", color: "#2E1A0F", opacity: busyId === item.id ? 0.7 : 1 }}
              >
                <X size={16} /> Kataa
              </button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
    </AuthGate>
  );
}
