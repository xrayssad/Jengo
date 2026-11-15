"use client";

import { formatPrice } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { quoteStay, type Priced, type Quote } from "@/lib/pricing";

export default function PriceBreakdown({
  item,
  quote,
  compact = false,
}: {
  item: Priced;
  quote?: Quote;
  compact?: boolean;
}) {
  const t = useT();
  const result = quote || quoteStay(item);
  if (!result.lines.length || result.due <= 0) return null;
  const dueKey =
    item.category === "apartment_airbnb"
      ? "fit.stay"
      : item.category === "vifaa"
        ? "fit.total"
        : item.category === "frame" || item.category === "store_godown"
          ? "fit.start"
          : "fit.movein";
  if (compact) {
    return <p className="fit-compact">{t(dueKey, { n: formatPrice(result.due) })}</p>;
  }
  return (
    <div className="fit-sheet">
      {result.lines.map((line) => (
        <p key={line.key} className="fit-line">
          <span>{t(`fit.line.${line.key}`)}</span>
          <span>TSh {formatPrice(line.amount)}</span>
        </p>
      ))}
      <p className="fit-line fit-due">
        <span>{t("fit.due")}</span>
        <span>TSh {formatPrice(result.due)}</span>
      </p>
      {result.deposit > 0 && item.category === "apartment_airbnb" ? (
        <p className="fit-note">{t("fit.depositNote", { n: formatPrice(result.deposit) })}</p>
      ) : null}
    </div>
  );
}
