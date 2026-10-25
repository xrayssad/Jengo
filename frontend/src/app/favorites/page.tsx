"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { type Listing } from "@/lib/api";
import { readSaved } from "@/lib/social";

export default function FavoritesPage() {
  const [items, setItems] = useState<Listing[]>([]);
  useEffect(() => {
    setItems(readSaved().map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      period: item.period,
      location: item.location,
      city: item.city,
      category: item.category,
      description: item.description,
      images: item.images,
    })));
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Vipendwa</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Matangazo uliyohifadhi</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-5 space-y-5">
        {items.length === 0 && (
          <div className="text-center py-16">
            <Bookmark size={28} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-heading" style={{ color: "#2E1A0F" }}>Hakuna favorites bado</p>
          </div>
        )}
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
