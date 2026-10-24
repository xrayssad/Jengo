"use client";

import { useState } from "react";
import {
  ArrowLeft, Home, Building2, Store, LayoutGrid,
  Camera, MapPin, Tag, FileText, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { createListing } from "@/lib/api"
import { rememberListing } from "@/lib/mine";
import AppAlert, { AlertKind } from "@/components/AppAlert";

const categories = [
  { id: "chumba_nyumba", title: "Chumba & Nyumba", desc: "Kwa mwezi au zaidi", icon: Home },
  { id: "apartment_airbnb", title: "Apartment & Airbnb", desc: "Usiku · siku · wiki · mwezi", icon: Building2 },
  { id: "store_godown", title: "Store & Godown", desc: "Maduka na maghala", icon: Store },
  { id: "frame", title: "Frame za Maduka", desc: "Frame / stall", icon: LayoutGrid },
];

const periodsByCategory: Record<string, { value: string; label: string }[]> = {
  chumba_nyumba: [
    { value: "mwezi", label: "Kwa mwezi" },
    { value: "miezi_3", label: "Miezi 3" },
    { value: "miezi_6", label: "Miezi 6" },
    { value: "mwaka", label: "Mwaka mzima" },
  ],
  apartment_airbnb: [
    { value: "usiku", label: "Usiku mmoja" },
    { value: "siku", label: "Kwa siku" },
    { value: "wiki", label: "Kwa wiki" },
    { value: "mwezi", label: "Kwa mwezi" },
  ],
  store_godown: [
    { value: "mwezi", label: "Kwa mwezi" },
    { value: "miezi_3", label: "Miezi 3" },
    { value: "miezi_6", label: "Miezi 6" },
    { value: "mwaka", label: "Mwaka mzima" },
  ],
  frame: [
    { value: "mwezi", label: "Kwa mwezi" },
    { value: "miezi_3", label: "Miezi 3" },
    { value: "miezi_6", label: "Miezi 6" },
    { value: "mwaka", label: "Mwaka mzima" },
  ],
};

export default function WekaTangazoPage() {
  const [category, setCategory] = useState("chumba_nyumba");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("mwezi");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Dar es Salaam");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("warning");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const showAlert = (kind: AlertKind, t: string, m?: string) => {
    setAlertKind(kind);
    setAlertTitle(t);
    setAlertMsg(m || "");
    setAlertOpen(true);
  };

  const periods = periodsByCategory[category] || periodsByCategory.chumba_nyumba;

  const selectCategory = (id: string) => {
    setCategory(id);
    setPeriod(periodsByCategory[id]?.[0]?.value || "mwezi");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !location.trim()) {
      showAlert("warning", "Taarifa hazijakamilika", "Jaza kichwa, bei na eneo.");
      return;
    }
    const priceNum = parseFloat(price.replace(/,/g, ""));
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      showAlert("warning", "Bei si sahihi", "Weka namba halali ya bei.");
      return;
    }

    setLoading(true);
    try {
      const created = await createListing({
        category,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        period,
        location: location.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        city: city.trim() || "Dar es Salaam",
      });
      if (created && typeof created === 'object' && 'id' in created) rememberListing(String((created as {id: string}).id));
      setSubmitted(true);
    } catch (err) {
      showAlert(
        "error",
        "Imeshindikana",
        err instanceof Error
          ? err.message
          : "Hakikisha backend inaendesha na jedwali listings lipo."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(145deg, #5E7F4F, #3D5C34)" }}>
            <CheckCircle2 size={40} color="#FFF6ED" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Tangazo limehifadhiwa!</h1>
          <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
            Linaonekana kwenye Discover na ukurasa wa kategoria yake.
          </p>
          <div className="space-y-3">
            <Link href="/discover" className="block w-full py-4 rounded-[20px] font-semibold text-center"
              style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>
              Angalia Discover
            </Link>
            <Link
              href={
                category === "apartment_airbnb"
                  ? "/airbnb"
                  : category === "store_godown"
                    ? "/maduka?aina=store"
                    : category === "frame"
                      ? "/maduka?aina=frame"
                      : "/nyumba"
              }
              className="block w-full py-3 rounded-[20px] font-semibold text-center"
              style={{ border: "1.5px solid #3D2415", color: "#2E1A0F" }}
            >
              Angalia kategoria
            </Link>
            <Link href="/home" className="block w-full py-3 rounded-[20px] font-semibold text-center"
              style={{ color: "#8B5E3C" }}>
              Rudi Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Weka Tangazo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Inahifadhiwa kwenye database</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "#2E1A0F" }}>Aina</label>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => selectCategory(cat.id)}
                  className="text-left p-3.5 rounded-[16px]"
                  style={{
                    background: active ? "linear-gradient(165deg, #3D2415, #2E1A0F)" : "white",
                    border: active ? "1.5px solid #8B5E3C" : "1.5px solid #3D2415",
                  }}>
                  <Icon size={20} color={active ? "#F5E6D3" : "#8B5E3C"} />
                  <p className="font-bold text-xs mt-2" style={{ color: active ? "#FFF6ED" : "#2E1A0F" }}>{cat.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: active ? "#D2A679" : "#5C4033" }}>{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Kichwa</label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Mfano: Chumba Kinondoni" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Bei (TZS)</label>
          <div className="relative mb-3">
            <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="180000"
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
          </div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Muda</label>
          <div className="grid grid-cols-2 gap-2">
            {periods.map((p) => (
              <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
                className="py-2.5 px-3 rounded-[12px] text-xs font-semibold"
                style={{
                  backgroundColor: period === p.value ? "#2E1A0F" : "white",
                  color: period === p.value ? "#FFF6ED" : "#2E1A0F",
                  border: period === p.value ? "none" : "1.5px solid #3D2415",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Eneo</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Kinondoni, Dar" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
          </div>
          <label className="block text-sm font-semibold mb-2 mt-4" style={{ color: "#2E1A0F" }}>Mji</label>
          <input value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Dar es Salaam" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        </div>

        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Link ya picha</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://...jpg" className="input-chocolate w-full px-4 py-3.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Maelezo</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" placeholder="Sifa za ziada..." />
        </div>

        <div className="rounded-[16px] py-8 flex flex-col items-center gap-2"
          style={{ border: "1.5px dashed #3D2415" }}>
          <Camera size={28} color="#8B5E3C" />
          <span className="text-xs" style={{ color: "#8B5E3C" }}>Picha — baadaye (storage)</span>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-[20px] font-semibold text-[15px]"
          style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED", opaimages: imageUrl.trim() ? [imageUrl.trim()] : [],
        city: loading ? 0.7 : 1 }}>
          {loading ? "Inahifadhi..." : "Chapisha Tangazo"}
        </button>
      </form>

      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg}
        onClose={() => setAlertOpen(false)} />
    </main>
  );
}
