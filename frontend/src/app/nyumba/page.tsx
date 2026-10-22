"use client";
import { ArrowLeft, MapPin, BadgeCheck, Heart, Home } from "lucide-react";
import Link from "next/link";

const listings = [
  { id: 1, title: "Chumba kizuri Kinondoni", price: "180,000", period: "/mwezi", location: "Kinondoni, Dar", verified: true },
  { id: 2, title: "Apartment 2 bedrooms Masaki", price: "320,000", period: "/mwezi", location: "Masaki, Dar", verified: true },
  { id: 3, title: "Nyumba ya family Mbezi", price: "450,000", period: "/mwezi", location: "Mbezi Beach, Dar", verified: false },
  { id: 4, title: "Bedsitter Mikocheni", price: "150,000", period: "/mwezi", location: "Mikocheni, Dar", verified: true },
];

export default function NyumbaPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Nyumba & Vyumba</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>{listings.length} yanapatikana</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {listings.map((item, i) => (
          <Link
            key={item.id}
            href={`/tangazo/${item.id}`}
            className={`card-lift block rounded-[22px] overflow-hidden anim-up d${Math.min(i + 1, 5)}`}
            style={{ backgroundColor: "white", border: "1px solid rgba(210,166,121,0.4)", boxShadow: "0 8px 24px rgba(46,26,15,0.08)" }}
          >
            <div className="relative h-44 flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(160deg, #FFF6ED 0%, #E8D5B7 100%)" }}>
              <Home size={52} color="#8B5E3C" strokeWidth={1.35} />
              {item.verified && (
                <div className="badge-shimmer absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#FFF6ED]">
                  <BadgeCheck size={13} strokeWidth={2.2} /> Amethibitishwa
                </div>
              )}
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "white", boxShadow: "0 2px 10px rgba(46,26,15,0.12)" }}>
                <Heart size={16} color="#8B5E3C" strokeWidth={2} />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-[15px] leading-snug" style={{ color: "#2E1A0F" }}>{item.title}</h3>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>TZS {item.price}</p>
                  <p className="text-xs" style={{ color: "#5C4033" }}>{item.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <MapPin size={13} color="#8B5E3C" strokeWidth={2} />
                <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
