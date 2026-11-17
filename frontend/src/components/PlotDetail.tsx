"use client";

import dynamic from "next/dynamic";
import { getAuthUser, formatPrice, type Listing } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { readFit } from "@/lib/pricing";
import { pricePerAcre, pricePerM2Of, sizeLabel } from "@/lib/plots";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

const CHECKS = ["visit", "office", "surveyor", "receipts", "family", "pay", "report"] as const;

export function PlotCardFacts({ item }: { item: Listing }) {
  const { lang, t } = useI18n();
  const fit = readFit(item);
  const size = sizeLabel(fit, lang);
  const perM2 = pricePerM2Of(item);
  const role = fit.poster_role;
  const prominent = role === "agent" || role === "developer";
  return (
    <div className="plot-card-facts">
      {size ? <p className="immerse-rate">{size}</p> : null}
      {perM2 > 0 ? <p className="immerse-rate">{t("plot.perM2", { n: formatPrice(perM2) })}</p> : null}
      <p className="fit-badges">
        {prominent ? <span className="fit-badge is-role">{t(`fit.role.${role}`)}</span> : null}
        {fit.land_use ? <span className="fit-badge">{t(`plot.use.${fit.land_use}`)}</span> : null}
        {fit.surveyed ? <span className="fit-badge">{t("plot.surveyedBadge")}</span> : null}
        {fit.tenure ? <span className="fit-badge">{t(`plot.tenure.short.${fit.tenure}`)}</span> : null}
        {fit.documents_checked ? <span className="fit-badge is-role">{t("plot.checked")}</span> : null}
      </p>
    </div>
  );
}

export default function PlotDetail({ item }: { item: Listing }) {
  const { lang, t } = useI18n();
  const fit = readFit(item);
  const loggedIn = Boolean(getAuthUser()?.access_token);
  const perM2 = pricePerM2Of(item);
  const perAcre = typeof fit.price_per_acre === "number" ? fit.price_per_acre : pricePerAcre(Number(item.price) || 0, Number(fit.plot_size) || 0, fit.plot_unit === "acre" || fit.plot_unit === "ha" ? fit.plot_unit : "m2");
  const showAcre = fit.plot_unit === "acre" || fit.plot_unit === "ha";
  const docs = Array.isArray(fit.documents) ? fit.documents : [];
  const boundary = Array.isArray(fit.boundary) ? fit.boundary.filter((pair) => Array.isArray(pair) && pair.length >= 2) as [number, number][] : [];
  const facts: Array<[string, string]> = [
    [t("plot.listingType"), fit.listing_type ? t(`plot.listing.${fit.listing_type}`) : ""],
    [t("plot.size"), sizeLabel(fit, lang)],
    [t("plot.perM2Label"), perM2 > 0 ? `TSh ${formatPrice(perM2)}` : ""],
    [t("plot.perAcreLabel"), showAcre && perAcre > 0 ? `TSh ${formatPrice(perAcre)}` : ""],
    [t("plot.landUse"), fit.land_use ? t(`plot.use.${fit.land_use}`) : ""],
    [t("plot.tenure"), fit.tenure ? t(`plot.tenure.${fit.tenure}`) : ""],
    [t("plot.landCategory"), fit.land_category ? t(`plot.land.${fit.land_category}`) : ""],
    [t("plot.road"), fit.road ? t(`plot.road.${fit.road}`) : ""],
    [t("plot.roadDistance"), fit.road_distance || ""],
    [t("plot.powerNear"), fit.electricity_nearby ? t("plot.yes") : t("plot.no")],
    [t("plot.waterNear"), fit.water_nearby ? t(`plot.water.${fit.water_nearby}`) : ""],
    [t("plot.town"), fit.town_distance || ""],
    [t("plot.terrain"), fit.terrain ? t(`plot.terrain.${fit.terrain}`) : ""],
    [t("plot.flood"), fit.flood ? t(`plot.flood.${fit.flood}`) : ""],
    [t("plot.fenced"), fit.fenced ? t("plot.yes") : t("plot.no")],
    [t("plot.structures"), fit.structures ? t(`plot.structure.${fit.structures}`) : ""],
    [t("plot.payment"), fit.payment ? t(`plot.pay.${fit.payment}`) : ""],
  ];
  if (loggedIn && fit.plot_number) facts.push([t("plot.plotNo"), fit.plot_number]);
  if (loggedIn && fit.block_number) facts.push([t("plot.blockNo"), fit.block_number]);

  return (
    <section className="plot-detail">
      {fit.documents_checked ? <p className="fit-badge is-role">{t("plot.checked")}</p> : null}
      <div className="plot-facts">
        {facts.filter(([, value]) => value).map(([label, value]) => (
          <p key={label}><span>{label}</span><strong>{value}</strong></p>
        ))}
      </div>
      {fit.payment_note ? <p className="fit-note">{fit.payment_note}</p> : null}
      {typeof fit.booking_deposit === "number" && fit.booking_deposit > 0 ? (
        <p className="fit-note">{t("plot.deposit")}: TSh {formatPrice(fit.booking_deposit)}</p>
      ) : null}
      <div>
        <p className="detail-heading">{t("plot.documents")}</p>
        {docs.length ? (
          <ul className="plot-docs">
            {docs.map((id) => <li key={id}>{t(`plot.doc.${id}`)}</li>)}
          </ul>
        ) : <p className="fit-note">{t("plot.noDocs")}</p>}
        <p className="fit-note">{fit.documents_checked ? t("plot.checkedNote") : t("plot.documentsNote")}</p>
      </div>
      {item.lat != null && item.lng != null ? (
        <div>
          <p className="detail-heading">{t("plot.map")}</p>
          <div className="overflow-hidden" style={{ borderRadius: 18 }}>
            <MapPreview lat={item.lat} lng={item.lng} polygon={boundary} />
          </div>
        </div>
      ) : null}
      {fit.video_url ? (
        <video className="plot-video" controls preload="metadata" src={fit.video_url} />
      ) : null}
      <aside className="plot-check">
        <p className="detail-heading">{t("plot.before")}</p>
        <ul>
          {CHECKS.map((id) => <li key={id}>{t(`plot.check.${id}`)}</li>)}
        </ul>
        <p className="fit-note">{t("plot.check.legal")}</p>
      </aside>
    </section>
  );
}
