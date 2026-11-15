"use client";

import type { Listing } from "@/lib/api";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

export default function SocialActions({ item }: { item: Listing }) {
  return (
    <div className="detail-actions">
      <LikeButton id={item.id} count={item.likes_count} />
      <SaveButton item={item} />
    </div>
  );
}
