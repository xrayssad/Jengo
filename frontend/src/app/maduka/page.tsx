"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Store, LayoutGrid, Loader2 } from "lucide-react";
import CategoryListings from "@/components/CategoryListings";

function MadukaInner() {
  const search = useSearchParams();
  const aina = search.get("aina") === "frame" ? "frame" : "store";
  const isFrame = aina === "frame";

  return (
    <CategoryListings
      title={isFrame ? "Frame za Maduka" : "Store & Godown"}
      category={isFrame ? "frame" : "store_godown"}
      icon={isFrame ? LayoutGrid : Store}
      tabs={
        <div className="flex gap-2 mt-3">
          <Link
            href="/maduka?aina=store"
            className="flex-1 py-2.5 rounded-[12px] text-xs font-semibold text-center"
            style={{
              backgroundColor: !isFrame ? "#2E1A0F" : "white",
              color: !isFrame ? "#FFF6ED" : "#2E1A0F",
              border: !isFrame ? "none" : "1.5px solid #3D2415",
            }}
          >
            Store & Godown
          </Link>
          <Link
            href="/maduka?aina=frame"
            className="flex-1 py-2.5 rounded-[12px] text-xs font-semibold text-center"
            style={{
              backgroundColor: isFrame ? "#2E1A0F" : "white",
              color: isFrame ? "#FFF6ED" : "#2E1A0F",
              border: isFrame ? "none" : "1.5px solid #3D2415",
            }}
          >
            Frame
          </Link>
        </div>
      }
    />
  );
}

export default function MadukaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF6ED" }}>
          <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
        </div>
      }
    >
      <MadukaInner />
    </Suspense>
  );
}
