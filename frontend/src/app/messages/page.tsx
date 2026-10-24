"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { readIndex, type ChatIndex } from "@/lib/chat";

export default function MessagesPage() {
  const [items, setItems] = useState<ChatIndex[]>([]);
  useEffect(() => setItems(readIndex()), []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="px-4 py-4 max-w-md mx-auto">
        <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Ujumbe</h1>
        <p className="text-xs" style={{ color: "#5C4033" }}>Mazungumzo ya simu hii</p>
      </header>
      <div className="max-w-md mx-auto px-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle size={36} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna ujumbe bado</p>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Fungua tangazo, kisha Andika ujumbe</p>
          </div>
        )}
        {items.map((c) => (
          <Link key={c.listing_id} href={`/chat/${c.listing_id}?title=${encodeURIComponent(c.title)}`} className="block p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
            <h2 className="font-bold" style={{ color: "#2E1A0F" }}>{c.title}</h2>
            <p className="text-sm truncate mt-1" style={{ color: "#5C4033" }}>{c.last}</p>
          </Link>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
