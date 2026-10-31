import type { Listing } from "@/lib/api";

export function posterLabel(item: { owner_name?: string | null; owner_username?: string | null }) {
  const name = (item.owner_name || "").trim();
  const username = (item.owner_username || "").trim();
  return { name, username, show: Boolean(name || username) };
}

export default function PosterName({
  item,
  tone = "ink",
}: {
  item: Pick<Listing, "owner_name" | "owner_username">;
  tone?: "ink" | "photo";
}) {
  const { name, username, show } = posterLabel(item);
  if (!show) return null;
  const initial = (name || username).slice(0, 1).toUpperCase();
  const titleColor = tone === "photo" ? "#FFF6ED" : "var(--ink)";
  const handleColor = tone === "photo" ? "rgba(255,246,237,0.82)" : "var(--muted)";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{
          backgroundColor: tone === "photo" ? "rgba(255,246,237,0.18)" : "var(--ink)",
          color: tone === "photo" ? "#FFF6ED" : "var(--paper)",
          boxShadow: tone === "photo" ? "0 0 0 1px rgba(255,246,237,0.28)" : "none",
        }}
      >
        {initial}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate leading-tight" style={{ color: titleColor, textShadow: tone === "photo" ? "0 1px 2px rgba(0,0,0,0.55)" : undefined }}>
          {name || username}
        </p>
        {username ? (
          <p className="text-[11px] truncate leading-tight" style={{ color: handleColor, textShadow: tone === "photo" ? "0 1px 2px rgba(0,0,0,0.45)" : undefined }}>
            @{username}
          </p>
        ) : null}
      </div>
    </div>
  );
}
