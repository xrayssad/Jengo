"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, BadgeCheck, Heart, Share2, Phone, MessageCircle, Shield } from "lucide-react";
import Link from "next/link";

type Item = {
  title: string;
  price: string;
  period: string;
  location: string;
  verified: boolean;
  category: string;
  description: string;
  seller: string;
  features: string[];
};

const allData: Record<string, Item> = {
  "1": {
    title: "Chumba kizuri Kinondoni",
    price: "180,000",
    period: "/mwezi",
    location: "Kinondoni, Dar es Salaam",
    verified: true,
    category: "Nyumba & Vyumba",
    description: "Chumba safi na kikubwa chenye dirisha kubwa, karibu na barabara kuu. Kina maji na umeme wa uhakika.",
    seller: "Juma Hassan",
    features: ["Maji ya bomba", "Umeme", "Usalama 24/7", "Karibu na daladala"],
  },
  "2": {
    title: "Apartment 2 bedrooms Masaki",
    price: "320,000",
    period: "/mwezi",
    location: "Masaki, Dar es Salaam",
    verified: true,
    category: "Nyumba & Vyumba",
    description: "Apartment ya kisasa yenye vyumba 2 vya kulala, sebule, jiko na bafu.",
    seller: "Asha Mohamed",
    features: ["Vyumba 2", "Jiko", "Bafu", "Parking"],
  },
  "3": {
    title: "Godown kubwa Mikocheni",
    price: "450,000",
    period: "/mwezi",
    location: "Mikocheni, Dar es Salaam",
    verified: true,
    category: "Maduka & Godown",
    description: "Godown kubwa lenye nafasi ya kutosha kwa biashara na lango la lori.",
    seller: "Peter Kimaro",
    features: ["Lango la lori", "Nafasi kubwa", "Usalama", "Umeme"],
  },
  "4": {
    title: "Saruji 50 mifuko",
    price: "1,150,000",
    period: "",
    location: "Kariakoo, Dar es Salaam",
    verified: true,
    category: "Vifaa vya Ujenzi",
    description: "Saruji bora ya ujenzi, mifuko 50. Bei ni ya jumla.",
    seller: "BuildMart TZ",
    features: ["Daraja A", "Mifuko 50", "Utoaji unapatikana"],
  },
};

export default function TangazoDetailsPage() {
  const [id, setId] = useState("1");

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    setId(parts[parts.length - 1] || "1");
  }, []);

  const item = allData[id] || allData["1"];

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/nyumba" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
              <ArrowLeft size={18} strokeWidth={2.2} />
            </Link>
            <div>
              <p className="text-xs font-medium" style={{ color: "#8B5E3C" }}>{item.category}</p>
              <h1 className="text-base font-bold" style={{ color: "#2E1A0F" }}>Maelezo</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(46,26,15,0.1)" }}>
              <Share2 size={17} color="#8B5E3C" strokeWidth={2} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(46,26,15,0.1)" }}>
              <Heart size={17} color="#8B5E3C" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <div className="relative h-56 flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(165deg, #3D2415 0%, #2E1A0F 60%, #1A0F08 100%)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 30%, #8B5E3C 0%, transparent 55%)" }} />
          <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(139,94,60,0.35)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            <Shield size={36} color="#F5E6D3" strokeWidth={1.5} />
          </div>
          {item.verified && (
            <div className="badge-shimmer absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#FFF6ED]">
              <BadgeCheck size={14} strokeWidth={2.2} /> Amethibitishwa
            </div>
          )}
        </div>

        <div className="px-4 -mt-5 relative z-10">
          <div className="rounded-[22px] p-5 shadow-warm" style={{ backgroundColor: "white", border: "1px solid rgba(210,166,121,0.35)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-xl font-bold leading-snug" style={{ color: "#2E1A0F" }}>{item.title}</h2>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold" style={{ color: "#2E1A0F" }}>TZS {item.price}</p>
                {item.period && <p className="text-xs" style={{ color: "#5C4033" }}>{item.period}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-5">
              <MapPin size={14} color="#8B5E3C" strokeWidth={2} />
              <span className="text-sm" style={{ color: "#5C4033" }}>{item.location}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {item.features.map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#FFF6ED", color: "#2E1A0F", border: "1px solid rgba(61,36,21,0.25)" }}>
                  {f}
                </span>
              ))}
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold mb-2" style={{ color: "#2E1A0F" }}>Maelezo</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5C4033" }}>{item.description}</p>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-[16px]"
              style={{ backgroundColor: "#FFF6ED", border: "1px solid rgba(61,36,21,0.2)" }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(145deg, #3D2415, #2E1A0F)", color: "#F5E6D3" }}>
                {item.seller.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#2E1A0F" }}>{item.seller}</p>
                <p className="text-xs" style={{ color: "#8B5E3C" }}>
                  {item.verified ? "Muuzaji aliyethibitishwa" : "Muuzaji"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-4 glass" style={{ borderTop: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex gap-3">
          <button className="flex-1 py-3.5 rounded-[16px] font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: "white", color: "#2E1A0F", border: "1.5px solid #3D2415", boxShadow: "0 2px 8px rgba(46,26,15,0.1)" }}>
            <Phone size={17} strokeWidth={2} /> Piga Simu
          </button>
          <Link
            href="/tuma-ombi"
            className="btn-primary flex-[1.4] py-3.5 rounded-[16px] font-semibold text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle size={17} strokeWidth={2} /> Tuma Ombi
          </Link>
        </div>
      </div>
    </main>
  );
}
