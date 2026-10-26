"use client";

import Link from "next/link";
import NextImage from "next/image";

const categories = [
  { href: "/nyumba", title: "Nyumba", img: "/real/room.jpg" },
  { href: "/airbnb", title: "Airbnb", img: "/real/apartment.jpg" },
  { href: "/maduka", title: "Maduka", img: "/real/shop.jpg" },
  { href: "/vifaa", title: "Vifaa", img: "/real/materials.jpg" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <section className="relative min-h-screen flex flex-col justify-end">
        <NextImage src="/real/apartment.jpg" alt="Makazi" fill className="object-cover" priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(46,26,15,0.72) 0%, rgba(46,26,15,0.18) 48%, rgba(46,26,15,0.08) 100%)" }} />
        <div className="relative z-10 px-5 pb-10 w-full max-w-md mx-auto fade-up">
          <div className="sheet rounded-[28px] p-6">
            <p className="text-sm" style={{ color: "#8B5E3C" }}>Jengo</p>
            <h1 className="font-heading text-[38px] leading-[1.05] mt-1" style={{ color: "#2E1A0F" }}>
              Makazi yenye utulivu
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#5C4033" }}>
              Nyumba, Airbnb, maduka na vifaa vya ujenzi. Bei wazi, picha halisi.
            </p>
            <div className="flex gap-3 mt-6">
              <Link href="/login" className="btn-primary flex-1 text-center py-3.5 rounded-full text-sm font-semibold">Ingia</Link>
              <Link href="/register" className="btn-secondary flex-1 text-center py-3.5 rounded-full text-sm font-semibold">Jisajili</Link>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar mt-4 pb-1">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className="relative shrink-0 overflow-hidden" style={{ width: 118, height: 88, borderRadius: 20 }}>
                <NextImage src={c.img} alt={c.title} fill className="object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(46,26,15,0.7), transparent 60%)" }} />
                <span className="absolute bottom-2 left-2.5 text-sm font-heading" style={{ color: "#FFF6ED" }}>{c.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
