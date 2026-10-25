"use client";

import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import LikeButton from "./LikeButton";

export default function SocialActions({
  listingId,
  title,
  likes,
  comments,
}: {
  listingId: string;
  title: string;
  likes?: number;
  comments?: number;
}) {
  return (
    <div className="flex items-center gap-5">
      <LikeButton id={listingId} count={likes} />
      <Link
        href={`/tangazo/${listingId}#maoni`}
        className="flex items-center gap-1.5"
        aria-label="Maoni"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageSquare size={20} color="#2E1A0F" strokeWidth={1.8} />
        <span className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{comments || 0}</span>
      </Link>
      <Link
        href={`/chat/${listingId}?title=${encodeURIComponent(title)}`}
        className="flex items-center gap-1.5"
        aria-label="Ujumbe wa moja kwa moja"
        onClick={(e) => e.stopPropagation()}
      >
        <Send size={19} color="#2E1A0F" strokeWidth={1.8} />
        <span className="text-xs font-semibold" style={{ color: "#8B5E3C" }}>Ujumbe</span>
      </Link>
    </div>
  );
}
