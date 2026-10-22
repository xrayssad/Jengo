"use client";

import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import Link from "next/link";

const conversations = [
  {
    id: 1,
    name: "Juma Hassan",
    lastMsg: "Chumba bado kinapatikana?",
    time: "10:24",
    unread: 2,
    listing: "Chumba Kinondoni",
    initial: "J",
  },
  {
    id: 2,
    name: "Asha Mohamed",
    lastMsg: "Naweza kuja kuona kesho asubuhi",
    time: "Jana",
    unread: 0,
    listing: "Apartment Masaki",
    initial: "A",
  },
  {
    id: 3,
    name: "Peter Kimaro",
    lastMsg: "Bei ya godown ni TZS 450,000/mwezi",
    time: "Jana",
    unread: 1,
    listing: "Godown Mikocheni",
    initial: "P",
  },
  {
    id: 4,
    name: "BuildMart TZ",
    lastMsg: "Saruji iko ready kwa kuchukua",
    time: "Wiki iliyopita",
    unread: 0,
    listing: "Vifaa Kariakoo",
    initial: "B",
  },
];

export default function MessagesPage() {
  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Messages</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Historia ya mazungumzo</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {conversations.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle size={48} color="#D2A679" className="mx-auto mb-4 opacity-50" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna messages bado</p>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Anza kwa kutuma ombi kwenye tangazo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 p-3.5 rounded-[18px] transition-colors"
                style={{
                  backgroundColor: "white",
                  border: "1px solid rgba(61,36,21,0.12)",
                  boxShadow: "0 2px 10px rgba(46,26,15,0.05)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  style={{ background: "linear-gradient(145deg, #3D2415, #2E1A0F)", color: "#F5E6D3" }}
                >
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm truncate" style={{ color: "#2E1A0F" }}>{c.name}</p>
                    <span className="text-[10px] shrink-0" style={{ color: "#8B5E3C" }}>{c.time}</span>
                  </div>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "#8B5E3C" }}>{c.listing}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: c.unread ? "#2E1A0F" : "#5C4033", fontWeight: c.unread ? 600 : 400 }}>
                    {c.lastMsg}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#8B5E3C", color: "#FFF6ED" }}
                  >
                    {c.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
