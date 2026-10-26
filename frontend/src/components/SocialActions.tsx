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
        aria-label="Direct message"
        onClick={(e) => e.stopPropagation()}
      >
        <Send size={19} color="var(--ink)" strokeWidth={1.8} />
        <span className="text-xs" style={{ color: "var(--mocha)" }}>Message</span>
      </Link>
    </div>
  );
}
