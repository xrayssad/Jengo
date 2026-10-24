"use client";

import { Home } from "lucide-react";
import CategoryListings from "@/components/CategoryListings";

export default function NyumbaPage() {
  return (
    <CategoryListings
      title="Chumba & Nyumba"
      category="chumba_nyumba"
      icon={Home}
    />
  );
}
