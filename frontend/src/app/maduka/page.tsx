"use client";
import ListingFeed from "@/components/ListingFeed";
import { shopCategories } from "@/lib/api";

export default function Page() {
  return <ListingFeed title="Maduka" subtitle="Frame za maduka" category={shopCategories} />;
}
