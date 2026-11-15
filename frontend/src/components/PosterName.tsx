"use client";

import type { Listing } from "@/lib/api";
import VerifiedBadge from "./VerifiedBadge";

type Poster = {
  owner_name?: string | null;
  owner_username?: string | null;
  is_verified?: boolean;
  owner_verified?: boolean;
  verified_type?: "individual" | "business" | null;
  owner?: Listing["owner"];
};

export function posterLabel(item: { owner_name?: string | null; owner_username?: string | null }) {
  const username = (item.owner_username || "").trim();
  const name = (item.owner_name || "").trim() || username || "Jengo";
  return { name, username, show: true };
}

export default function PosterName({
  item,
  tone = "ink",
}: {
  item: Poster;
  tone?: "ink" | "photo";
}) {
  const { name, username, show } = posterLabel(item);
  if (!show) return null;
  const initial = (name || username).slice(0, 1).toUpperCase();
  const titleColor = tone === "photo" ? "#FFF6ED" : "var(--text)";
  const handleColor = tone === "photo" ? "rgba(255,246,237,0.82)" : "var(--muted)";
  const verified = Boolean(item.is_verified || item.owner_verified || item.owner?.is_verified || item.owner?.verified);
  const raw = item.verified_type || item.owner?.verified_type;
  const kind = raw === "business" || raw === "individual" ? raw : null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={tone === "photo" ? "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" : "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"}
        style={{
          backgroundColor: tone === "photo" ? "rgba(255,246,237,0.18)" : "var(--primary)",
          color: tone === "photo" ? "#FFF6ED" : "#F7F2EA",
          boxShadow: tone === "photo" ? "0 0 0 1px rgba(255,246,237,0.28)" : "none",
        }}
      >
        {initial}
      </span>
      <div className="min-w-0">
        <p className={tone === "photo" ? "name-line text-sm font-semibold leading-tight" : "name-line text-[15px] font-semibold leading-tight"} style={{ color: titleColor, textShadow: tone === "photo" ? "0 1px 2px rgba(0,0,0,0.55)" : undefined }}>
          <span className="truncate">{name || username}</span>
          {verified ? <VerifiedBadge size={tone === "photo" ? "sm" : "md"} type={kind} /> : null}
        </p>
        {username ? (
          <p className={tone === "photo" ? "text-[11px] truncate leading-tight" : "text-[13px] truncate leading-tight"} style={{ color: handleColor, textShadow: tone === "photo" ? "0 1px 2px rgba(0,0,0,0.45)" : undefined }}>
            @{username}
          </p>
        ) : null}
      </div>
    </div>
  );
}
