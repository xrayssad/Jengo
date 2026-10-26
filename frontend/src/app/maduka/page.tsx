"use client";
import ListingFeed from "@/components/ListingFeed";
import { shopCategories } from "@/lib/api";

export default function Page() {
  return <ListingFeed title="Shop frames" subtitle="Shop frames for rent" category={shopCategories} />;
}
