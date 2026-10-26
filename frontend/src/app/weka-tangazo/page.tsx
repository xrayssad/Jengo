"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createListing } from "@/lib/api";
import { rememberListing } from "@/lib/mine";
import AppAlert, { type AlertKind } from "@/components/AppAlert";
import AuthGate from "@/components/AuthGate";
import PlacePicker, { type PlaceValue } from "@/components/PlacePicker";
import PhotoPicker from "@/components/PhotoPicker";

const categories = [
  { id: "chumba_nyumba", label: "Houses / Rooms" },
  { id: "apartment_airbnb", label: "Apartment & Airbnb" },
  { id: "store_godown", label: "Godown / Store" },
  { id: "frame", label: "Shop frames" },
  { id: "vifaa", label: "Building materials" },
];

const units = [
  { id: "mfuko", label: "bag" },
  { id: "tani", label: "tonne" },
  { id: "kipande", label: "piece" },
  { id: "dei", label: "day" },
];

const periods: Record<string, { id: string; label: string }[]> = {
  chumba_nyumba: [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
  ],
  apartment_airbnb: [
    { id: "usiku", label: "Night" },
    { id: "siku", label: "Day" },
    { id: "wiki", label: "Week" },
    { id: "mwezi", label: "Month" },
  ],
  store_godown: [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
  ],
  frame: [
    { id: "mwezi", label: "Month" },
    { id: "miezi_3", label: "3 months" },
    { id: "miezi_6", label: "6 months" },
    { id: "mwaka", label: "Year" },
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
  const [place, setPlace] = useState<PlaceValue>({ location: "", city: "", lat: null, lng: null });
  const [photos, setPhotos] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([""]);
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
    if (title.trim().length < 3 || !price || !place.location.trim()) {
      show("error", "Fill in the fields", "Title, price and location are required.");
      return;
    }
    if (category === "vifaa" && (stock === "" || Number.isNaN(Number(stock)) || Number(stock) < 0)) {
      show("error", "Enter stock", "Available quantity is required.");
      return;
    }
    setLoading(true);
    try {
      const isVifaa = category === "vifaa";
      const contact = phones.map((p) => p.trim()).filter(Boolean).slice(0, 3);
      const desc = description.trim();
      const created = await createListing({
        category,
        title: title.trim(),
        description: contact.length ? `${desc}${desc ? "\n\n" : ""}Phone: ${contact.join(", ")}` : desc,
        price: Number(price),
        period: isVifaa ? "" : period,
        location: place.location.trim(),
        city: place.city.trim(),
        images: photos.slice(0, 6),
        lat: place.lat,
        lng: place.lng,
        phones: contact,
        ...(isVifaa ? { unit, stock: Number(stock) } : {}),
      });
      if (created?.id) rememberListing(String(created.id));
      setDone(true);
    } catch (err) {
      show("error", "Could not publish", err instanceof Error ? err.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthGate>
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--paper)" }}>
        <div className="sheet max-w-sm w-full text-center p-6 rounded-[28px]">
          <h1 className="font-heading text-3xl mb-2" style={{ color: "var(--ink)" }}>Listing posted</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>It is live on Discover now.</p>
          <button type="button" onClick={() => router.push("/discover")} className="btn-primary w-full py-3.5 rounded-[16px] font-semibold text-sm">
            View Discover
          </button>
          <button type="button" onClick={() => router.push("/home")} className="btn-secondary w-full mt-3 py-3.5 rounded-[16px] font-semibold text-sm">
            Back to Home
          </button>
        </div>
      </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 glass">
        <button type="button" onClick={() => router.push("/home")} className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
          <ArrowLeft size={18} color="var(--ink)" />
        </button>
        <h1 className="font-heading text-2xl" style={{ color: "var(--ink)" }}>Post a listing</h1>
      </header>

      <form onSubmit={submit} className="max-w-md mx-auto px-4 pt-5">
      <div className="sheet rounded-[28px] p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                if (c.id !== "vifaa") setPeriod(periods[c.id][0].id);
              }}
              className="p-3 rounded-[18px] text-sm"
              style={{
                backgroundColor: category === c.id ? "var(--ink)" : "rgba(var(--paper-rgb),0.7)",
                color: category === c.id ? "var(--paper)" : "var(--ink)",
                border: "1px solid rgba(var(--caramel-rgb),0.45)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />

        {category === "vifaa" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {units.map((u) => (
                <button key={u.id} type="button" onClick={() => setUnit(u.id)} className={`px-3 py-2 text-xs ${unit === u.id ? "rounded-full" : "chip"}`} style={unit === u.id ? { backgroundColor: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink)" }}>
                  {u.label}
                </button>
              ))}
            </div>
            <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock / quantity" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {periods[category].map((p) => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`px-3 py-2 text-xs ${period === p.id ? "rounded-full" : "chip"}`} style={period === p.id ? { backgroundColor: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink)" }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Photos</p>
          <PhotoPicker urls={photos} onChange={setPhotos} />
        </div>
        <div>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Location</p>
          <PlacePicker value={place} onChange={setPlace} />
        </div>
        <div>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Contact phone numbers</p>
          <div className="space-y-2">
            {phones.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={p}
                  onChange={(e) => setPhones((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "Example: 0712 345 678" : "Another number"}
                  inputMode="tel"
                  className="input-chocolate w-full px-4 py-3.5 text-sm"
                />
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhones((cur) => cur.filter((_, j) => j !== i))}
                    className="text-sm px-3"
                    style={{ color: "var(--mocha)" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {phones.length < 3 && (
            <button
              type="button"
              onClick={() => setPhones((cur) => [...cur, ""])}
              className="text-sm mt-2"
              style={{ color: "var(--mocha)" }}
            >
              + Add number
            </button>
          )}
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Description" className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" />

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? "Publishing..." : "Publish listing"}
        </button>
      </div>
      </form>

      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
    </AuthGate>
  );
}
