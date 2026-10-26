"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { readSavedImages, type SavedImage } from "@/lib/savedImages";

export default function SavedImagesPage() {
  const [items, setItems] = useState<SavedImage[]>([]);
  useEffect(() => setItems(readSavedImages()), []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Saved photos</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Photos you saved from a post</p>
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-4 grid grid-cols-2 gap-3">
        {items.length === 0 && (
          <div className="col-span-2 text-center py-16">
            <Download size={32} color="#D2A679" className="mx-auto mb-3" />
            <p className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>No photos yet</p>
          </div>
        )}
        {items.map((img) => (
          <Link key={img.id} href={`/tangazo/${img.listing_id}`} className="estate-card block">
            <img src={img.url} alt="" className="w-full h-36 object-cover" />
            <p className="text-xs p-2 truncate" style={{ color: "#2E1A0F" }}>{img.title}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
