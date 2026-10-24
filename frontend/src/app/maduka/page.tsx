"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ListingFeed from "@/components/ListingFeed";

function Inner() {
  const aina = useSearchParams().get("aina");
  if (aina === "frame") {
    return <ListingFeed title="Frame za Maduka" subtitle="Frame na stall" category="frame" />;
  }
  return <ListingFeed title="Store & Godown" subtitle="Maduka na maghala" category="store_godown" />;
}

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />}>
      <Inner />
    </Suspense>
  );
}
