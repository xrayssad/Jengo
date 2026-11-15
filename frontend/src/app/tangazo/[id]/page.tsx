import { Suspense } from "react";
import type { Metadata } from "next";
import { DetailSkeleton } from "@/components/Skeletons";
import DetailsClient from "./DetailsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL || "https://jengo-qkq1.onrender.com";
  try {
    const res = await fetch(`${base}/listings/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "Jengo" };
    const item = await res.json();
    const title = String(item.title || "Jengo");
    const area = [item.city, item.location].filter(Boolean).join(", ");
    const description = [title, item.price ? `TSh ${item.price}` : "", area].filter(Boolean).join(" · ");
    const image = Array.isArray(item.images) ? item.images.find(Boolean) : "";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: "Jengo" };
  }
}

export const instant = false;

async function Body({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailsClient id={id} />;
}

export default function TangazoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Body params={params} />
    </Suspense>
  );
}
