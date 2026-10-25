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
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.88) 0%, rgba(46,26,15,0.45) 50%, rgba(26,15,8,0.2) 100%)" }} />
        <div className="relative z-10 px-6 pb-16 max-w-md fade-up">
          <h1 className="font-heading text-4xl leading-tight" style={{ color: "#FFF6ED" }}>
            Makazi na vifaa, mahali pamoja
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,246,237,0.82)" }}>
            Chumba, Airbnb, maduka na vifaa vya ujenzi — bei wazi.
          </p>
          <div className="flex gap-3 mt-7">
            <Link href="/login" className="btn-primary flex-1 text-center py-3.5 rounded-full text-sm font-semibold">Ingia</Link>
            <Link href="/register" className="flex-1 text-center py-3.5 rounded-full text-sm font-semibold" style={{ backgroundColor: "rgba(255,246,237,0.14)", color: "#FFF6ED", border: "1px solid rgba(255,246,237,0.4)" }}>Jisajili</Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="relative overflow-hidden card-lift" style={{ height: 150, borderRadius: 22 }}>
              <NextImage src={c.img} alt={c.title} fill className="object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.75), transparent 55%)" }} />
              <span className="absolute bottom-3 left-3 font-heading" style={{ color: "#FFF6ED" }}>{c.title}</span>
            </Link>
          ))}
        </div>
        <div className="flex justify-between mt-8 text-sm" style={{ color: "#5C4033" }}>
          <span>Imethibitishwa</span>
          <span>Bei wazi</span>
          <span>Ombi salama</span>
        </div>
      </section>
    </main>
  );
}
