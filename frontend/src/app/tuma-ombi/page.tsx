"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { createBooking, fetchListing, listingUnit, unitLabel, type Listing } from "@/lib/api";
import { rememberBooking } from "@/lib/mine";
import AppAlert, { AlertKind } from "@/components/AppAlert";
import AuthGate from "@/components/AuthGate";

function TumaOmbiForm() {
  const search = useSearchParams();
  const listingId = search.get("listing") || "";
  const title = search.get("title") || "Tangazo";
  const hintCat = search.get("category") || "";
  const backHref = listingId ? `/tangazo/${listingId}` : "/home";

  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(search.get("qty") || "1");
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const showAlert = (kind: AlertKind, t: string, m?: string) => {
    setAlertKind(kind);
    setAlertTitle(t);
    setAlertMsg(m || "");
    setAlertOpen(true);
  };

  useEffect(() => {
    if (!listingId) return;
    let stop = false;
    (async () => {
      try {
        const data = await fetchListing(listingId);
        if (!stop) setListing(data);
      } catch {}
    })();
    return () => {
      stop = true;
    };
  }, [listingId]);

  const isVifaa = listing?.category === "vifaa" || hintCat === "vifaa";
  const unit = listing ? listingUnit(listing) : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) {
      showAlert("error", "Hitilafu", "Tangazo halijulikani. Rudi undani wa tangazo.");
      return;
    }
    const quantity = Number(qty);
    if (isVifaa && (qty.trim() === "" || Number.isNaN(quantity) || quantity <= 0)) {
      showAlert("error", "Jaza kiasi", "Weka kiasi unachotaka.");
      return;
    }
    setLoading(true);
    try {
      await createBooking({
        listing_id: listingId,
        message: message.trim() || "Nina nia ya tangazo hili.",
        ...(isVifaa ? { quantity } : {}),
      });
      rememberBooking({ listing_id: listingId, title, message: message.trim(), created_at: new Date().toISOString() });
      setDone(true);
    } catch (err) {
      showAlert(
        "error",
        "Imeshindikana",
        err instanceof Error ? err.message : "Jaribu tena baadaye."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-sm w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(145deg, #5E7F4F, #3D5C34)" }}
          >
            <CheckCircle2 size={40} color="#FFF6ED" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Ombi limetumwa</h1>
          <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
            Ombi lako kuhusu «{title}» limepokelewa.
          </p>
          <div className="space-y-3">
            <Link
              href={backHref}
              className="block w-full py-3.5 rounded-[16px] font-semibold text-sm"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
            >
              Rudi tangazo
            </Link>
            <Link
              href="/home"
              className="block w-full py-3 rounded-[16px] font-semibold text-sm"
              style={{ color: "#8B5E3C" }}
            >
              Rudi Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{
          backgroundColor: "rgba(255,246,237,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(210,166,121,0.35)",
        }}
      >
        <Link
          href={backHref}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
        >
          <ArrowLeft size={18} color="#2E1A0F" />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Tuma Ombi</h1>
          <p className="text-xs truncate max-w-[220px]" style={{ color: "#8B5E3C" }}>{title}</p>
        </div>
      </header>

      <form onSubmit={submit} className="max-w-md mx-auto px-4 pt-6">
      <div className="soft-card p-5 space-y-5">
        <p className="text-sm" style={{ color: "#5C4033" }}>
          Andika ujumbe mfupi kwa mwenye tangazo.
        </p>
        {isVifaa && (
          <label className="block">
            <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>
              Kiasi{unit ? ` (${unitLabel(unit)})` : ""}
            </span>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              className="input-chocolate w-full mt-2 px-4 py-3.5 text-sm"
            />
            {listing?.stock != null && (
              <span className="block text-xs mt-1" style={{ color: "#8B5E3C" }}>Stock: {listing.stock}</span>
            )}
          </label>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Mfano: Habari, naomba kujua kama bado kinapatikana..."
          className="input-chocolate w-full px-4 py-3.5 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? "Inatuma..." : "Tuma Ombi"}
        </button>
      </div>
      </form>

      <AppAlert
        open={alertOpen}
        kind={alertKind}
        title={alertTitle}
        message={alertMsg}
        onClose={() => setAlertOpen(false)}
      />
    </main>
  );
}

export default function TumaOmbiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF6ED" }}>
        <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
      </div>
    }>
      <AuthGate>
        <TumaOmbiForm />
      </AuthGate>
    </Suspense>
  );
}
