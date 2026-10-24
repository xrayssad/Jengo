"use client";

import { KeyRound } from "lucide-react";
import CategoryListings from "@/components/CategoryListings";

export default function AirbnbPage() {
  return (
    <CategoryListings
      title="Apartment & Airbnb"
      category="apartment_airbnb"
      icon={KeyRound}
      variant="dark"
    />
  );
}
