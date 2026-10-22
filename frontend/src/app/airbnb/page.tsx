"use client";

import { ArrowLeft, MapPin, BadgeCheck, Heart, KeyRound } from "lucide-react";
import Link from "next/link";

const listings = [
  { id: 1, title: "Studio ya wageni Masaki", price: "85,000", period: "/usiku", location: "Masaki, Dar", verified: true },
  { id: 2, title: "Apartment 1BR Mikocheni", price: "120,000", period: "/usiku", location: "Mikocheni, Dar", verified: true },
  { id: 3, title: "Chumba kizuri City Centre", price: "55,000", period: "/usiku", location: "Posta, Dar", verified: false },
  { id: 4, title: "Villa ndogo Mbezi Beach", price: "250,000", period: "/usiku", location: "Mbezi Beach, Dar", verified: true },
];

export default function AirbnbPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Airbnb</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Makazi ya muda mfupi</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {listings.map((item) => (
          <Link
            key={item.id}
            href={`/tangazo/${item.id}`}
            className="card-lift block rounded-[18px] overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.15)", boxShadow: "0 4px 16px rgba(46,26,15,0.07)" }}
          >
            <div className="h-36 flex items-center justify-center" style={{ background: "linear-gradient(165deg, #3D2415, #2E1A0F)" }}>
              <KeyRound size={40} color="#D2A679" strokeWidth={1.5} />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.verified && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: "#8B5E3C" }}>
                        <BadgeCheck size={12} /> Amethibitishwa
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>{item.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} color="#8B5E3C" />
                    <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[15px]" style={{ color: "#2E1A0F" }}>TZS {item.price}</p>
                  <p className="text-xs" style={{ color: "#5C4033" }}>{item.period}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
