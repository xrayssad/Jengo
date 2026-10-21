"use client";
import { useState } from "react";
import { ArrowLeft, Upload, Camera, MapPin, Tag, FileText, CheckCircle2, Home, Store, BrickWall, Gavel } from "lucide-react";
import Link from "next/link";

const categories = [
  { id: "nyumba", label: "Nyumba & Vyumba", icon: Home },
  { id: "maduka", label: "Maduka & Godown", icon: Store },
  { id: "vifaa", label: "Vifaa vya Ujenzi", icon: BrickWall },
  { id: "mnada", label: "Mnada", icon: Gavel },
];

export default function WekaTangazoPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("/mwezi");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !title || !price || !location) {
      alert("Tafadhali jaza sehemu zote muhimu");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-md w-full text-center anim-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(145deg, #D2A679, #8B5E3C)", boxShadow: "0 8px 24px rgba(46,26,15,0.2)" }}>
            <CheckCircle2 size={40} color="#FFF6ED" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Tangazo Limewekwa!</h1>
          <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
            Tangazo lako limetumwa kwa ukaguzi. Litaonekana baada ya kuidhinishwa.
          </p>
          <Link href="/" className="btn-primary inline-block w-full py-4 rounded-[20px] font-semibold text-center">
            Rudi Nyumbani
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Weka Tangazo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Uza au pangisha bidhaa yako</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Category */}
        <div className="anim-up">
          <label className="block text-sm font-semibold mb-3" style={{ color: "#2E1A0F" }}>Chagua Aina ya Tangazo</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)}
                  className="p-4 rounded-[18px] text-left transition-all duration-200"
                  style={{
                    background: isSelected
                      ? "linear-gradient(165deg, #3D2415 0%, #2E1A0F 100%)"
                      : "white",
                    border: isSelected ? "1.5px solid #8B5E3C" : "1.5px solid #3D2415",
                    color: isSelected ? "#FFF6ED" : "#2E1A0F",
                    boxShadow: isSelected
                      ? "0 0 16px rgba(139,94,60,0.35), 0 6px 16px rgba(46,26,15,0.3)"
                      : "0 2px 8px rgba(46,26,15,0.08)",
                  }}>
                  <Icon size={22} color={isSelected ? "#F5E6D3" : "#8B5E3C"} strokeWidth={1.8} className="mb-2" />
                  <span className="text-sm font-medium block">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="anim-up d1">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Kichwa cha Tangazo</label>
          <div className="relative">
            <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Mfano: Chumba kizuri Kinondoni"
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
          </div>
        </div>

        {/* Price + Period */}
        <div className="grid grid-cols-2 gap-3 anim-up d2">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Bei (TZS)</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="180,000"
              className="input-chocolate w-full px-4 py-3.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Kipindi</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="input-chocolate w-full px-4 py-3.5 text-sm">
              <option value="/mwezi">Kwa mwezi</option>
              <option value="">Bei ya mara moja</option>
              <option value="kuanzia">Kuanzia (Mnada)</option>
              <option value="/siku">Kwa siku</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="anim-up d3">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Eneo</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Mfano: Kinondoni, Dar es Salaam"
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
          </div>
        </div>

        {/* Description */}
        <div className="anim-up d4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Maelezo</label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-4 z-10" color="#8B5E3C" strokeWidth={2} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Eleza zaidi kuhusu bidhaa au nyumba yako..." rows={4}
              className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm resize-none" />
          </div>
        </div>

        {/* Image upload */}
        <div className="anim-up d5">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Picha</label>
          <div className="rounded-[18px] p-8 text-center cursor-pointer transition-all duration-25"
            style={{
              backgroundColor: "#FFF6ED",
              border: "1.5px dashed #3D2415",
              boxShadow: "0 0 0 1px rgba(46,26,15,0.1), 0 2px 8px rgba(46,26,15,0.06)",
            }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(145deg, #3D2415, #2E1A0F)", boxShadow: "0 4px 12px rgba(46,26,15,0.3)" }}>
                <Camera size={22} color="#F5E6D3" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#2E1A0F" }}>Bofya kuweka picha</p>
              <p className="text-xs" style={{ color: "#5C4033" }}>PNG, JPG hadi 5MB</p>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-4 rounded-[20px] font-semibold text-[15px] flex items-center justify-center gap-2">
          <Upload size={18} strokeWidth={2} />
          Chapisha Tangazo
        </button>
      </form>
    </main>
  );
}
