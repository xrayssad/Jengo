"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { formatPrice, uploadReelVideo } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  PLOT_DOCS,
  formatMeasure,
  pricePerAcre,
  pricePerM2,
  type PlotDraft,
  type PlotPayment,
  type PlotUnit,
} from "@/lib/plots";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

function digits(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 12);
}

function Chip({ on, label, press }: { on: boolean; label: string; press: () => void }) {
  return (
    <button type="button" className={on ? "filter-chip is-on" : "filter-chip"} aria-pressed={on} onClick={press}>
      {label}
    </button>
  );
}

export default function PlotFields({
  part,
  plot,
  price,
  place,
  onChange,
  onPlace,
  tried,
}: {
  part: "deal" | "site" | "media";
  plot: PlotDraft;
  price: string;
  place?: { lat: number | null; lng: number | null };
  onChange: (next: PlotDraft) => void;
  onPlace?: (lat: number, lng: number) => void;
  tried?: boolean;
}) {
  const t = useT();
  const [drawing, setDrawing] = useState(false);
  const [videoNote, setVideoNote] = useState("");
  const patch = (partial: Partial<PlotDraft>) => onChange({ ...plot, ...partial });
  const amount = Number(price || 0);
  const size = Number(plot.size);
  const perM2 = pricePerM2(amount, size, plot.unit);
  const perAcre = pricePerAcre(amount, size, plot.unit);
  const showAcre = plot.unit === "acre" || plot.unit === "ha";

  if (part === "media") {
    return (
      <label className="wizard-field">
        <span className="wizard-label">{t("plot.video")} <span className="wizard-optional">({t("optional")})</span></span>
        <input
          className="wizard-input"
          type="file"
          accept="video/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setVideoNote(t("plot.videoWait"));
            void uploadReelVideo(file)
              .then((res) => {
                patch({ video: res.video_url });
                setVideoNote(t("plot.videoReady"));
              })
              .catch(() => setVideoNote(t("plot.videoFail")));
          }}
        />
        {plot.video ? <span className="wizard-hint">{t("plot.videoReady")}</span> : null}
        {videoNote ? <span className="wizard-hint">{videoNote}</span> : null}
      </label>
    );
  }

  if (part === "deal") {
    return (
      <div className="plot-fields">
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.listingType")}</span>
          <div className="wizard-chips">
            {(["sale", "lease"] as const).map((id) => (
              <Chip key={id} on={plot.listingType === id} label={t(`plot.listing.${id}`)} press={() => patch({ listingType: id })} />
            ))}
          </div>
        </div>
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.size")} <i>*</i></span>
          <input className="wizard-input" inputMode="decimal" value={plot.size} onChange={(e) => patch({ size: digits(e.target.value) })} />
          <div className="wizard-chips">
            {(["m2", "acre", "ha"] as PlotUnit[]).map((id) => (
              <Chip key={id} on={plot.unit === id} label={t(`plot.unit.${id}`)} press={() => patch({ unit: id })} />
            ))}
          </div>
          {tried && !(size > 0) ? <span className="wizard-error">{t("plot.sizeRequired")}</span> : null}
        </div>
        <div className="wizard-row">
          <label className="wizard-field">
            <span className="wizard-label">{t("plot.width")} <span className="wizard-optional">({t("optional")})</span></span>
            <input className="wizard-input" inputMode="decimal" value={plot.width} onChange={(e) => patch({ width: digits(e.target.value) })} />
          </label>
          <label className="wizard-field">
            <span className="wizard-label">{t("plot.length")} <span className="wizard-optional">({t("optional")})</span></span>
            <input className="wizard-input" inputMode="decimal" value={plot.length} onChange={(e) => patch({ length: digits(e.target.value) })} />
          </label>
        </div>
        {perM2 > 0 ? (
          <p className="fit-note">
            {t("plot.perM2", { n: formatPrice(perM2) })}
            {showAcre && perAcre > 0 ? ` · ${t("plot.perAcre", { n: formatPrice(perAcre) })}` : ""}
          </p>
        ) : null}
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.payment")}</span>
          <div className="wizard-chips">
            {(["full", "installments", "deposit"] as PlotPayment[]).map((id) => (
              <Chip key={id} on={plot.payment === id} label={t(`plot.pay.${id}`)} press={() => patch({ payment: id })} />
            ))}
          </div>
          {plot.payment === "installments" ? (
            <label className="wizard-field">
              <span className="wizard-label">{t("plot.payNote")}</span>
              <input className="wizard-input" maxLength={160} value={plot.paymentNote} onChange={(e) => patch({ paymentNote: e.target.value })} />
            </label>
          ) : null}
          {plot.payment === "deposit" ? (
            <label className="wizard-field">
              <span className="wizard-label">{t("plot.deposit")}</span>
              <input className="wizard-input" inputMode="numeric" value={plot.bookingDeposit} onChange={(e) => patch({ bookingDeposit: e.target.value.replace(/\D/g, "").slice(0, 12) })} />
            </label>
          ) : null}
        </div>
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.landUse")} <i>*</i></span>
          <div className="wizard-chips">
            {(["residential", "commercial", "agricultural", "industrial", "mixed"] as const).map((id) => (
              <Chip key={id} on={plot.landUse === id} label={t(`plot.use.${id}`)} press={() => patch({ landUse: id })} />
            ))}
          </div>
          {tried && !plot.landUse ? <span className="wizard-error">{t("plot.useRequired")}</span> : null}
        </div>
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.tenure")} <i>*</i></span>
          <div className="wizard-chips">
            {(["gro", "ccro", "residential_licence", "village", "other"] as const).map((id) => (
              <Chip key={id} on={plot.tenure === id} label={t(`plot.tenure.${id}`)} press={() => patch({ tenure: id })} />
            ))}
          </div>
          <span className="wizard-hint">{t("plot.tenureHint")}</span>
          {tried && !plot.tenure ? <span className="wizard-error">{t("plot.tenureRequired")}</span> : null}
        </div>
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.landCategory")} <span className="wizard-optional">({t("optional")})</span></span>
          <div className="wizard-chips">
            {(["general", "village", "reserved"] as const).map((id) => (
              <Chip key={id} on={plot.landCategory === id} label={t(`plot.land.${id}`)} press={() => patch({ landCategory: plot.landCategory === id ? "" : id })} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lat = place?.lat;
  const lng = place?.lng;
  return (
    <div className="plot-fields">
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.documents")}</span>
        <div className="wizard-chips">
          {PLOT_DOCS.map((id) => (
            <Chip
              key={id}
              on={plot.documents.includes(id)}
              label={t(`plot.doc.${id}`)}
              press={() => patch({
                documents: plot.documents.includes(id)
                  ? plot.documents.filter((item) => item !== id)
                  : [...plot.documents, id],
              })}
            />
          ))}
        </div>
      </div>
      <div className="wizard-toggle">
        <span>{t("plot.surveyed")}</span>
        <button type="button" className={plot.surveyed ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={plot.surveyed} onClick={() => patch({ surveyed: !plot.surveyed })}><i /></button>
      </div>
      <div className="wizard-row">
        <label className="wizard-field">
          <span className="wizard-label">{t("plot.plotNo")} <span className="wizard-optional">({t("optional")})</span></span>
          <input className="wizard-input" maxLength={40} value={plot.plotNumber} onChange={(e) => patch({ plotNumber: e.target.value })} />
        </label>
        <label className="wizard-field">
          <span className="wizard-label">{t("plot.blockNo")} <span className="wizard-optional">({t("optional")})</span></span>
          <input className="wizard-input" maxLength={40} value={plot.blockNumber} onChange={(e) => patch({ blockNumber: e.target.value })} />
        </label>
      </div>
      <p className="wizard-hint">{t("plot.numbersPrivate")}</p>
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.road")}</span>
        <div className="wizard-chips">
          {(["tarmac", "murram", "footpath"] as const).map((id) => (
            <Chip key={id} on={plot.road === id} label={t(`plot.road.${id}`)} press={() => patch({ road: id })} />
          ))}
        </div>
      </div>
      <label className="wizard-field">
        <span className="wizard-label">{t("plot.roadDistance")}</span>
        <input className="wizard-input" maxLength={40} value={plot.roadDistance} onChange={(e) => patch({ roadDistance: e.target.value })} />
      </label>
      <div className="wizard-toggle">
        <span>{t("plot.powerNear")}</span>
        <button type="button" className={plot.electricity ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={plot.electricity} onClick={() => patch({ electricity: !plot.electricity })}><i /></button>
      </div>
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.waterNear")}</span>
        <div className="wizard-chips">
          {(["mains", "borehole", "none"] as const).map((id) => (
            <Chip key={id} on={plot.water === id} label={t(`plot.water.${id}`)} press={() => patch({ water: id })} />
          ))}
        </div>
      </div>
      <label className="wizard-field">
        <span className="wizard-label">{t("plot.town")}</span>
        <input className="wizard-input" maxLength={40} value={plot.townDistance} onChange={(e) => patch({ townDistance: e.target.value })} />
      </label>
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.terrain")}</span>
        <div className="wizard-chips">
          {(["flat", "slope"] as const).map((id) => (
            <Chip key={id} on={plot.terrain === id} label={t(`plot.terrain.${id}`)} press={() => patch({ terrain: id })} />
          ))}
        </div>
      </div>
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.flood")}</span>
        <div className="wizard-chips">
          {(["none", "some", "unknown"] as const).map((id) => (
            <Chip key={id} on={plot.flood === id} label={t(`plot.flood.${id}`)} press={() => patch({ flood: id })} />
          ))}
        </div>
      </div>
      <div className="wizard-toggle">
        <span>{t("plot.fenced")}</span>
        <button type="button" className={plot.fenced ? "wizard-switch is-on" : "wizard-switch"} aria-pressed={plot.fenced} onClick={() => patch({ fenced: !plot.fenced })}><i /></button>
      </div>
      <div className="wizard-field">
        <span className="wizard-label">{t("plot.structures")}</span>
        <div className="wizard-chips">
          {(["none", "foundation", "building", "trees"] as const).map((id) => (
            <Chip key={id} on={plot.structures === id} label={t(`plot.structure.${id}`)} press={() => patch({ structures: id })} />
          ))}
        </div>
      </div>
      {lat != null && lng != null ? (
        <div className="wizard-field">
          <span className="wizard-label">{t("plot.boundary")} <span className="wizard-optional">({t("optional")})</span></span>
          <div className="wizard-chips">
            <Chip on={drawing} label={t("plot.draw")} press={() => setDrawing((on) => !on)} />
            <Chip on={false} label={t("plot.undo")} press={() => patch({ boundary: plot.boundary.slice(0, -1) })} />
            <Chip on={false} label={t("plot.clearBoundary")} press={() => patch({ boundary: [] })} />
          </div>
          <div className="mt-3 overflow-hidden" style={{ borderRadius: 18 }}>
            <MapPreview
              lat={lat}
              lng={lng}
              draggable
              polygon={plot.boundary}
              draw={drawing}
              onMove={onPlace}
              onPolygon={(points) => patch({ boundary: points })}
            />
          </div>
          <span className="wizard-hint">{t("plot.boundaryHint")}</span>
        </div>
      ) : (
        <p className="wizard-error">{t("plot.pinRequired")}</p>
      )}
    </div>
  );
}
