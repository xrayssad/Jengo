"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, CheckCircle2, MessageSquare, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function TumaOmbiPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Demo tangazo (baadaye litatoka kwenye URL/query)
  const listing = {
    title: "Chumba kizuri Kinondoni",
    price: "180,000",
    period: "/mwezi",
    location: "Kinondoni, Dar es Salaam",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Jaza jina na namba ya simu");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-md w-full text-center anim-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(145deg, #5E7F4F, #3D5C34)",
              boxShadow: "0 8px 24px rgba(94,127,79,0.35)",
            }}
          >
            <CheckCircle2 size={40} color="#FFF6ED" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2E1A0F" }}>Ombi Limetumwa!</h1>
          <p className="text-sm mb-2" style={{ color: "#5C4033" }}>
            Ombi lako la <strong>{listing.title}</strong> limetumwa kwa muuzaji.
          </p>
          <p className="text-xs mb-8" style={{ color: "#8B5E3C" }}>
            Utapokea taarifa baada ya kujibiwa.
          </p>
          <div className="space-y-3">
            <Link href="/" className="btn-primary block w-full py-4 rounded-[20px] font-semibold text-center">
              Rudi Nyumbani
            </Link>
            <Link
              href="/profile"
              className="block w-full py-3.5 rounded-[18px] font-semibold text-center text-sm"
              style={{ backgroundColor: "white", color: "#2E1A0F", border: "1.5px solid #3D2415" }}
            >
              Angalia Profile Yangu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/tangazo/1" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Tuma Ombi</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Jaza fomu hapa chini</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Tangazo linaloomba */}
        <div
          className="rounded-[18px] p-4"
          style={{
            backgroundColor: "white",
            border: "1.5px solid #3D2415",
            boxShadow: "0 0 0 1px rgba(46,26,15,0.1), 0 4px 16px rgba(46,26,15,0.08)",
          }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "#8B5E3C" }}>Unaomba:</p>
          <h2 className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>{listing.title}</h2>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <MapPin size={12} color="#8B5E3C" />
              <span className="text-xs" style={{ color: "#5C4033" }}>{listing.location}</span>
            </div>
            <p className="font-bold text-sm" style={{ color: "#2E1A0F" }}>
              TZS {listing.price}
              <span className="text-xs font-normal" style={{ color: "#5C4033" }}> {listing.period}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Jina lako</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jina kamili"
                className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Namba ya simu</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Tarehe unayotaka (si lazima)</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" color="#8B5E3C" strokeWidth={2} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#2E1A0F" }}>Ujumbe (si lazima)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Andika ujumbe mfupi kwa muuzaji..."
              rows={4}
              className="input-chocolate w-full px-4 py-3.5 text-sm resize-none"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-4 rounded-[20px] font-semibold text-[15px]">
            Tuma Ombi Sasa
          </button>
        </form>
      </div>
    </main>
  );
}
