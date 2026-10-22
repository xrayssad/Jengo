"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, Store, BrickWall, Gavel, ArrowRight, Shield, BadgeCheck, Search } from "lucide-react";

const features = [
  { icon: Home, title: "Nyumba & Vyumba", desc: "Panga au uze nyumba salama", img: "/poster_nyumba_salama.png" },
  { icon: Store, title: "Maduka & Godown", desc: "Frame na nafasi za biashara", img: "/poster_maduka_godown.png" },
  { icon: BrickWall, title: "Vifaa vya Ujenzi", desc: "Saruji, chuma, matofali", img: "/poster_vifaa_ujenzi.png" },
  { icon: Gavel, title: "Mnada", desc: "Bei bora inashinda", img: "/poster_mnada_rahisi.png" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-30 px-4 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.3)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #8B5E3C, #2E1A0F)" }}>
              <Home size={18} color="#FFF6ED" strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-base block leading-tight" style={{ color: "#2E1A0F" }}>Jengo</span>
              <span className="text-[10px] tracking-wider uppercase" style={{ color: "#8B5E3C" }}>App</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold px-3 py-2" style={{ color: "#2E1A0F" }}>Ingia</Link>
            <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>Jisajili</Link>
          </div>
        </div>
      </header>

      <section className="px-4 pt-10 pb-8 max-w-lg mx-auto text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#8B5E3C" }}>Marketplace ya Tanzania</p>
        <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: "#2E1A0F" }}>
          Nyumba, maduka na vifaa — yote mahali pamoja
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5C4033" }}>
          Jengo ni jukwaa la kupangisha nyumba na vyumba, kuuza au kupanga maduka na godown, kuuza vifaa vya ujenzi, na kufanya mnada. Bei wazi, wauzaji waliothibitishwa.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 py-4 rounded-[18px] font-semibold text-[15px]">
            Anza Bure <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center py-3.5 rounded-[18px] font-semibold text-[15px]" style={{ backgroundColor: "white", color: "#2E1A0F", border: "1.5px solid #3D2415" }}>
            Nina akaunti — Ingia
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Shield, label: "Malipo salama" },
            { icon: BadgeCheck, label: "Waliothibitishwa" },
            { icon: Search, label: "Tafuta haraka" },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl py-3 px-2 text-center" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
              <t.icon size={20} color="#8B5E3C" className="mx-auto mb-1.5" />
              <p className="text-[11px] font-medium" style={{ color: "#2E1A0F" }}>{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-10 max-w-lg mx-auto">
        <h2 className="text-lg font-bold mb-1" style={{ color: "#2E1A0F" }}>Tunachofanya</h2>
        <p className="text-xs mb-4" style={{ color: "#5C4033" }}>Huduma nne kuu katika jukwaa moja</p>
        <div className="space-y-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-3 rounded-[18px] overflow-hidden" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.15)" }}>
                <div className="relative w-28 shrink-0 min-h-[88px]">
                  <Image src={f.img} alt={f.title} fill className="object-cover" />
                </div>
                <div className="flex-1 py-3 pr-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={14} color="#8B5E3C" />
                    <h3 className="font-bold text-sm" style={{ color: "#2E1A0F" }}>{f.title}</h3>
                  </div>
                  <p className="text-xs" style={{ color: "#5C4033" }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-10 max-w-lg mx-auto">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#2E1A0F" }}>Jinsi inavyofanya kazi</h2>
        {[
          { n: "1", t: "Jisajili bure", d: "Fungua akaunti kwa namba ya simu" },
          { n: "2", t: "Tafuta au weka tangazo", d: "Chagua kategoria — nyumba, duka, vifaa au mnada" },
          { n: "3", t: "Wasiliana / Tuma ombi", d: "Ongea na mwenye nyumba au muuzaji" },
        ].map((s) => (
          <div key={s.n} className="flex gap-3 items-start mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>{s.n}</div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#2E1A0F" }}>{s.t}</p>
              <p className="text-xs" style={{ color: "#5C4033" }}>{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 pb-12 max-w-lg mx-auto">
        <div className="rounded-[22px] p-6 text-center" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#FFF6ED" }}>Tayari kuanza?</h2>
          <p className="text-sm mb-5" style={{ color: "#D2A679" }}>Jisajili sasa — ni bure</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-[16px] font-semibold" style={{ backgroundColor: "#D2A679", color: "#2E1A0F" }}>
            Fungua Akaunti <ArrowRight size={18} />
          </Link>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#5C4033" }}>© 2026 Jengo App · Tanzania</p>
      </section>
    </main>
  );
}
