"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import type { Listing } from "@/lib/api";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

export default function SocialActions({ item }: { item: Listing }) {
  return (
    <div className="flex items-center gap-5">
      <LikeButton id={item.id} count={item.likes_count} />
      <SaveButton item={item} />
      <Link
        href={`/chat/${item.id}?title=${encodeURIComponent(item.title)}`}
        className="flex items-center gap-1.5"
        aria-label="Ujumbe wa moja kwa moja"
        onClick={(e) => e.stopPropagation()}
      >
        <Send size={19} color="#2E1A0F" strokeWidth={1.8} />
        <span className="text-xs" style={{ color: "#8B5E3C" }}>Ujumbe</span>
      </Link>
    </div>
  );
}
