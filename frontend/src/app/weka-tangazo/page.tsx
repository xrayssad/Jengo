"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createListing } from "@/lib/api";
import { rememberListing } from "@/lib/mine";
import AppAlert, { type AlertKind } from "@/components/AppAlert";
import AuthGate from "@/components/AuthGate";

const categories = [
  { id: "chumba_nyumba", label: "Chumba & Nyumba" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "store_godown", label: "Store & Godown" },
  { id: "frame", label: "Frame za Maduka" },
  { id: "vifaa", label: "Vifaa" },
];

const units = [
  { id: "mfuko", label: "Mfuko" },
  { id: "tani", label: "Tani" },
  { id: "kipande", label: "Kipande" },
  { id: "dei", label: "Dei" },
];

const periods: Record<string, { id: string; label: string }[]> = {
  chumba_nyumba: [
    { id: "mwezi", label: "Mwezi" },
    { id: "miezi_3", label: "Miezi 3" },
    { id: "miezi_6", label: "Miezi 6" },
    { id: "mwaka", label: "Mwaka" },
  ],
  apartment_airbnb: [
    { id: "usiku", label: "Usiku" },
    { id: "siku", label: "Siku" },
    { id: "wiki", label: "Wiki" },
    { id: "mwezi", label: "Mwezi" },
  ],
  store_godown: [
    { id: "mwezi", label: "Mwezi" },
    { id: "miezi_3", label: "Miezi 3" },
    { id: "miezi_6", label: "Miezi 6" },
    { id: "mwaka", label: "Mwaka" },
  ],
  frame: [
    { id: "mwezi", label: "Mwezi" },
    { id: "miezi_3", label: "Miezi 3" },
    { id: "miezi_6", label: "Miezi 6" },
    { id: "mwaka", label: "Mwaka" },
  ],
};

export default function WekaTangazoPage() {
  const router = useRouter();
  const [category, setCategory] = useState("chumba_nyumba");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("mwezi");
  const [unit, setUnit] = useState("mfuko");
  const [stock, setStock] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const show = (kind: AlertKind, titleText: string, msg?: string) => {
    setAlertKind(kind);
    setAlertTitle(titleText);
    setAlertMsg(msg || "");
    setAlertOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || !price || !location.trim()) {
      show("error", "Jaza sehemu", "Kichwa, bei na eneo vinahitajika.");
      return;
    }
    if (category === "vifaa" && (stock === "" || Number.isNaN(Number(stock)) || Number(stock) < 0)) {
      show("error", "Jaza stock", "Idadi iliyopo inahitajika.");
      return;
    }
    setLoading(true);
    try {
      const isVifaa = category === "vifaa";
      const created = await createListing({
        category,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        period: isVifaa ? "" : period,
        location: location.trim(),
        city: city.trim() || "Dar es Salaam",
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        ...(isVifaa ? { unit, stock: Number(stock) } : {}),
      });
      if (created?.id) rememberListing(String(created.id));
      setDone(true);
    } catch (err) {
      show("error", "Imeshindikana", err instanceof Error ? err.message : "Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthGate>
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-sm w-full text-center">
          <h1 className="font-heading text-xl mb-2" style={{ color: "#2E1A0F" }}>Tangazo limewekwa</h1>
          <p className="text-sm mb-6" style={{ color: "#5C4033" }}>Linaonekana kwenye Discover sasa.</p>
          <button type="button" onClick={() => router.push("/discover")} className="btn-primary w-full py-3.5 rounded-[16px] font-semibold text-sm">
            Angalia Discover
          </button>
          <button type="button" onClick={() => router.push("/home")} className="btn-secondary w-full mt-3 py-3.5 rounded-[16px] font-semibold text-sm">
            Rudi Home
          </button>
        </div>
      </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <button type="button" onClick={() => router.push("/home")} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
          <ArrowLeft size={18} color="#2E1A0F" />
        </button>
        <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Weka Tangazo</h1>
      </header>

      <form onSubmit={submit} className="max-w-md mx-auto px-4 pt-5">
      <div className="soft-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                if (c.id !== "vifaa") setPeriod(periods[c.id][0].id);
              }}
              className="p-3 rounded-[16px] text-sm font-semibold"
              style={{
                backgroundColor: category === c.id ? "#2E1A0F" : "white",
                color: category === c.id ? "#FFF6ED" : "#2E1A0F",
                border: "1.5px solid #3D2415",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kichwa" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Bei" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />

        {category === "vifaa" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {units.map((u) => (
                <button key={u.id} type="button" onClick={() => setUnit(u.id)} className="px-3 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: unit === u.id ? "#8B5E3C" : "white", color: unit === u.id ? "#FFF6ED" : "#2E1A0F", border: "1px solid #D2A679" }}>
                  {u.label}
                </button>
              ))}
            </div>
            <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock / idadi" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {periods[category].map((p) => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className="px-3 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: period === p.id ? "#8B5E3C" : "white", color: period === p.id ? "#FFF6ED" : "#2E1A0F", border: "1px solid #D2A679" }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Eneo, mfano Kinondoni" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mji" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Link ya picha https://...jpg" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Maelezo" className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" />

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? "Inachapisha..." : "Chapisha Tangazo"}
        </button>
      </div>
      </form>

      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
    </AuthGate>
  );
}
