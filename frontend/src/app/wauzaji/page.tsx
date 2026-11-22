"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, MoreHorizontal } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fetchTopSellers, getAuthUser, type TopSeller } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { TOP_SELLERS_ENABLED } from "@/lib/productFlags";

const SPANS = ["week", "month", "all"] as const;

export default function TopSellersPage() {
  const t = useT();
  const router = useRouter();
  const [span, setSpan] = useState<(typeof SPANS)[number]>("week");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [items, setItems] = useState<TopSeller[]>([]);
  const [me, setMe] = useState("");

  useEffect(() => {
    setMe(getAuthUser()?.user_id || "");
    if (!TOP_SELLERS_ENABLED) router.replace("/home");
  }, [router]);

  useEffect(() => {
    if (!TOP_SELLERS_ENABLED) return;
    let stop = false;
    fetchTopSellers(span)
      .then((res) => {
        if (stop) return;
        if ((res.eligible || 0) < 5 || res.items.length < 5) {
          router.replace("/home");
          return;
        }
        setItems(res.items);
      })
      .catch(() => {
        if (!stop) router.replace("/home");
      });
    return () => {
      stop = true;
    };
  }, [router, span]);

  if (!TOP_SELLERS_ENABLED) return null;
  const shown = verifiedOnly ? items.filter((item) => item.verified) : items;
  if (shown.length < 5) return null;
  const hero = shown[0];
  const rest = shown.slice(1);

  return (
    <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
      <header className="board-top">
        <button type="button" className="soft-icon-btn" aria-label={t("back")} onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </button>
        <h1>{t("sellers.title")}</h1>
        <button type="button" className="soft-icon-btn" aria-label={t("sellers.more")} onClick={() => setVerifiedOnly((on) => !on)}>
          <MoreHorizontal size={18} />
        </button>
      </header>
      <div className="canvas-read px-5">
        <div className="board-filters">
          {SPANS.map((key) => (
            <button key={key} type="button" className={span === key ? "filter-chip is-on" : "filter-chip"} aria-pressed={span === key} onClick={() => setSpan(key)}>
              {t(`sellers.span.${key}`)}
            </button>
          ))}
          <button type="button" className={verifiedOnly ? "filter-chip is-on" : "filter-chip"} aria-pressed={verifiedOnly} onClick={() => setVerifiedOnly((on) => !on)}>
            {t("filter.verified")}
          </button>
        </div>
        <article className="board-hero">
          <span className="laurel" aria-hidden><BadgeCheck size={28} /></span>
          <p className="board-name">{hero.name}</p>
          <p className="board-meta">{t("sellers.listings", { n: hero.listings })}</p>
        </article>
        <ol className="board-list">
          {rest.map((item, index) => (
            <li key={item.user_id} className={item.user_id === me ? "is-you" : ""}>
              <b>{index + 2}</b>
              <span className="board-avatar">{(item.name || "J").slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{item.name} {item.verified ? <VerifiedBadge size="sm" /> : null}</strong>
                <small>
                  {t("sellers.listings", { n: item.listings })}
                  {typeof item.response_minutes === "number" ? ` · ${t("sellers.response", { n: item.response_minutes })}` : ""}
                  {typeof item.viewings === "number" ? ` · ${t("sellers.viewings", { n: item.viewings })}` : ""}
                  {typeof item.reviews === "number" ? ` · ${t("sellers.reviews", { n: item.reviews })}` : ""}
                </small>
              </span>
              {item.user_id === me ? <em>{t("sellers.you")}</em> : null}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
