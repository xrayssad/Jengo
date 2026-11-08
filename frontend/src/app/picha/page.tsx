"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { readSavedImages, type SavedImage } from "@/lib/savedImages";

export default function SavedImagesPage() {
  const [items, setItems] = useState<SavedImage[]>([]);
  useEffect(() => setItems(readSavedImages()), []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Saved photos</h1>
            <p className="page-note">Photos you saved from a post</p>
          </div>
        </div>
      </header>
      <div className="canvas px-4 pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.length === 0 && (
          <div className="col-span-full empty-panel">
            <Download size={32} color="var(--caramel)" className="mx-auto mb-3" />
            <p className="lead">No photos yet</p>
          </div>
        )}
        {items.map((img) => (
          <Link key={img.id} href={`/tangazo/${img.listing_id}`} className="estate-card block">
            <img src={img.url} alt="" className="w-full h-36 object-cover" />
            <p className="text-xs p-2 truncate" style={{ color: "var(--ink)" }}>{img.title}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
