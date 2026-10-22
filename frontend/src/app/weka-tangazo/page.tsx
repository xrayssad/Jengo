"use client";

import { useState } from "react";
import {
  ArrowLeft, Building2, KeyRound, Store, LayoutGrid,
  Camera, MapPin, Tag, FileText, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import AppAlert, { AlertKind } from "@/components/AppAlert";

const categories = [
  {
    id: "apartment",
    title: "Apartments / Nyumba",
    desc: "Kupanga kwa mwezi au zaidi",
    icon: Building2,
  },
  {
    id: "airbnb",
    title: "Airbnb",
    desc: "Usiku, siku au wiki",
    icon: KeyRound,
  },
  {
    id: "store_godown",
    title: "Store & Godown",
    desc: "Maduka na maghala",
    icon: Store,
  },
  {
    id: "frame",
    title: "Frame za Maduka",
    desc: "Frame / stall za biashara",
    icon: LayoutGrid,
  },
];

const periodsByCategory: Record<string, { value: string; label: string }[]> = {
  apartment: [
    { value: "mwezi", label: "Kwa mwezi" },
    { value: "miezi_3", label: "Miezi 3" },
    { value: "miezi_6", label: "Miezi 6" },
    { value: "mwaka", label: "Mwaka mzima" },
  ],
  airbnb: [
    { value: "usiku", label: "Usiku mmoja" },
    { value: "siku", label: "Kwa siku (chagua idadi)" },
    { value: "wiki", label: "Kwa wiki (chagua idadi)" },
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
  const [category, setCategory] = useState("apartment");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("mwezi");
  const [duration, setDuration] = useState(""); // idadi ya siku/wiki kwa Airbnb
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("warning");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const showAlert = (kind: AlertKind, title: string, message?: string) => {
    setAlertKind(kind);
    setAlertTitle(title);
    setAlertMsg(message || "");
    setAlertOpen(true);
  };

  const periods = periodsByCategory[category] || periodsByCategory.apartment;
  const isAirbnb = category === "airbnb";
  const needsDuration = isAirbnb && (period === "siku" || period === "wiki");

  // Badilisha category → reset period default
  const selectCategory = (id: string) => {
    setCategory(id);
    const first = periodsByCategory[id]?.[0]?.value || "mwezi";
    setPeriod(first);
    setDuration("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) {
      showAlert("warning", "Taarifa hazijakamilika", "Jaza angalau: kichwa, bei na eneo.");
      return;
    }
    if (needsDuration && !duration) {
      showAlert("warning", "Idadi inahitajika", "Weka idadi ya siku au wiki.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(145deg, #5E7F4F, #3D5C34)", boxShadow: "0 8px 24px rgba(94,127,79,0.35)" }}
          >
            <CheckCircle2 size={40} color="#FFF6ED" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Tangazo limewekwa!</h1>
          <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
            Tangazo lako litahakikiwa kisha litaonekana kwa wateja.
          </p>
          <Link href="/home" className="btn-primary block w-full py-4 rounded-[20px] font-semibold text-center">
            Rudi Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          {/* BACK → /home */}
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Weka Tangazo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Chagua kategoria na jaza maelezo</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* Kategoria */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "#2E1A0F" }}>
            Aina ya tangazo
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className="text-left p-3.5 rounded-[16px] transition-all"
                  style={{
                    background: active
                      ? "linear-gradient(165deg, #3D2415, #2E1A0F)"
                      : "white",
                    border: active ? "1.5px solid #8B5E3C" : "1.5px solid #3D2415",
                    boxShadow: active ? "0 0 16px rgba(139,94,60,0.25)" : "none",
                  }}
                >
                  <Icon size={20} color={active ? "#F5E6D3" : "#8B5E3C"} strokeWidth={1.8} />
                  <p className="font-bold text-xs mt-2" style={{ color: active ? "#FFF6ED" : "#2E1A0F" }}>
                    {cat.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: active ? "#D2A679" : "#5C4033" }}>
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kichwa */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Kichwa cha tangazo</label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === "airbnb"
                  ? "Mfano: Studio ya wageni Masaki"
                  : category === "frame"
                  ? "Mfano: Frame ya duka Kariakoo"
                  : category === "store_godown"
                  ? "Mfano: Godown kubwa Mikocheni"
                  : "Mfano: Apartment 2 bedrooms Masaki"
              }
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
            />
          </div>
        </div>

        {/* Bei + muda */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Bei (TZS)</label>
          <div className="relative mb-3">
            <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" />
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Mfano: 180000"
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
            />
          </div>

          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>
            {isAirbnb ? "Kipindi cha kukodisha" : "Muda wa bei"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setPeriod(p.value);
                  if (p.value === "usiku") setDuration("");
                }}
                className="py-2.5 px-3 rounded-[12px] text-xs font-semibold transition-all"
                style={{
                  backgroundColor: period === p.value ? "#2E1A0F" : "white",
                  color: period === p.value ? "#FFF6ED" : "#2E1A0F",
                  border: period === p.value ? "none" : "1.5px solid #3D2415",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Airbnb: idadi ya siku au wiki */}
          {needsDuration && (
            <div className="mt-3">
              <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>
                {period === "siku" ? "Idadi ya siku" : "Idadi ya wiki"}
              </label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={period === "siku" ? "Mfano: 3" : "Mfano: 2"}
                className="input-chocolate w-full px-4 py-3.5 text-sm"
              />
              <p className="text-[11px] mt-1.5" style={{ color: "#5C4033" }}>
                Bei uliyoweka ni kwa {period === "siku" ? "siku" : "wiki"} moja. Mteja atachagua idadi anayotaka.
              </p>
            </div>
          )}

          {isAirbnb && period === "usiku" && (
            <p className="text-[11px] mt-2" style={{ color: "#5C4033" }}>
              Bei ni kwa usiku mmoja. Mteja anaweza kuchagua usiku mmoja au zaidi.
            </p>
          )}
        </div>

        {/* Eneo */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Eneo</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mfano: Kinondoni, Dar es Salaam"
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
            />
          </div>
        </div>

        {/* Maelezo */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Maelezo</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Eleza sifa, huduma, sheria za kukaa..."
            rows={4}
            className="input-chocolate w-full px-4 py-3.5 text-sm resize-none"
          />
        </div>

        {/* Picha */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Picha</label>
          <div
            className="rounded-[16px] py-10 flex flex-col items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: "#FFF6ED",
              border: "1.5px dashed #3D2415",
            }}
          >
            <Camera size={28} color="#8B5E3C" strokeWidth={1.5} />
            <span className="text-xs font-medium" style={{ color: "#8B5E3C" }}>Bofya kuongeza picha</span>
            <span className="text-[10px]" style={{ color: "#5C4033" }}>(Inakuja na backend)</span>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-4 rounded-[20px] font-semibold text-[15px]">
          Chapisha Tangazo
        </button>
      </form>
      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
  );
}
