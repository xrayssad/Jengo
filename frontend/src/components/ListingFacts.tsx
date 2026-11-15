"use client";

import { useEffect, useState } from "react";
import { decideStay, decideViewing, formatPrice, getAuthUser, listStays, listViewings, quoteStayApi, requestStay, requestStorage, requestViewing, reviewEligibility, setAvailability, writeReview, type Listing } from "@/lib/api";
import { categoryConfig } from "@/lib/categories.config";
import { useT } from "@/lib/i18n";
import { quoteStay, readFit, type Quote } from "@/lib/pricing";
import PriceBreakdown from "./PriceBreakdown";

function waNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `255${digits.slice(1)}`;
  return digits;
}

export function shareText(item: Listing) {
  const due = quoteStay(item).due || Number(item.price) || 0;
  const area = [item.city, item.location].filter(Boolean).join(", ");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/tangazo/${item.id}`;
  return [item.title, due ? `TSh ${formatPrice(due)}` : "", area, url].filter(Boolean).join("\n");
}

export default function ListingFacts({ item }: { item: Listing }) {
  const t = useT();
  const [lang, setLang] = useState<"en" | "sw">("en");
  const fit = readFit(item);
  const config = categoryConfig(item.category);
  const [mine, setMine] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [slot, setSlot] = useState("morning");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guests, setGuests] = useState(fit.guests || fit.included_guests || 1);
  const [stayQuote, setStayQuote] = useState<Quote | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewings, setViewings] = useState<{ id: string; visit_date: string; slot: string; status: string }[]>([]);
  const [stays, setStays] = useState<{ id: string; start_date: string; end_date: string; guests: number; status: string; total: number }[]>([]);
  const [canReview, setCanReview] = useState<{ id: string; kind: string } | null>(null);
  const [goods, setGoods] = useState("");
  const [storeStart, setStoreStart] = useState("");
  const [summary, setSummary] = useState<Record<string, string | number | null> | null>(null);

  useEffect(() => {
    const owner = getAuthUser()?.user_id === item.owner_id;
    setMine(owner);
    setLang(document.documentElement.lang === "sw" ? "sw" : "en");
    if (owner) {
      void listViewings(item.id).then((res) => setViewings(res.items || [])).catch(() => setViewings([]));
      void listStays(item.id).then((res) => setStays(res.items || [])).catch(() => setStays([]));
    } else if (getAuthUser()) {
      void reviewEligibility(item.id).then((res) => {
        if (res.can && res.interaction_id && res.interaction_kind) setCanReview({ id: res.interaction_id, kind: res.interaction_kind });
      }).catch(() => setCanReview(null));
    }
  }, [item.id, item.owner_id]);

  const role = fit.poster_role;
  const wa = fit.whatsapp || "";
  const map = item.lat != null && item.lng != null
    ? `https://www.google.com/maps?q=${item.lat},${item.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.location, item.city].filter(Boolean).join(", "))}`;
  const message = shareText(item);

  const sendViewing = async () => {
    if (!visitDate || busy) return;
    setBusy(true);
    setNote("");
    try {
      await requestViewing(item.id, { visit_date: visitDate, slot });
      setNote(t("fit.sent"));
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("fit.sent"));
    } finally {
      setBusy(false);
    }
  };

  const priceStay = async () => {
    if (!start || !end) return;
    setBusy(true);
    setNote("");
    try {
      const quote = await quoteStayApi(item.id, { start_date: start, end_date: end, guests });
      setStayQuote(quote);
    } catch (err) {
      const nights = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86400000));
      setStayQuote(quoteStay(item, { nights, guests }));
      setNote(err instanceof Error ? err.message : "");
    } finally {
      setBusy(false);
    }
  };

  const book = async () => {
    if (!start || !end || busy) return;
    setBusy(true);
    try {
      await requestStay(item.id, { start_date: start, end_date: end, guests });
      setNote(t("fit.sent"));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "");
    } finally {
      setBusy(false);
    }
  };

  const mark = async (status: "active" | "rented" | "paused") => {
    setBusy(true);
    try {
      await setAvailability(item.id, status);
      setNote(t("fit.sent"));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="fit-block">
      <div className="fit-badges">
        {role ? <span className="fit-badge">{t(`fit.role.${role}`)}</span> : null}
        {fit.direct_owner ? <span className="fit-badge">{t("fit.direct")}</span> : null}
        {fit.free_viewing ? <span className="fit-badge">{t("fit.free")}</span> : null}
        {fit.costs_confirmed ? <span className="fit-badge">{t("fit.costs")}</span> : null}
        {fit.last_confirmed_at ? <span className="fit-badge">{t("fit.confirmed")}</span> : null}
        {fit.reply_within === "hour" || fit.reply_within === "day" ? (
          <span className="fit-badge">{t(`fit.reply.${fit.reply_within}`)}</span>
        ) : null}
      </div>
      <PriceBreakdown item={item} />
      {fit.landmark ? <p className="fit-note">{t("fit.landmark")}: {fit.landmark}</p> : null}
      {fit.directions ? <p className="fit-note">{fit.directions}</p> : null}
      {[
        fit.floor && `${t("fit.floor")}: ${fit.floor}`,
        fit.suitable && `${t("fit.suitable")}: ${fit.suitable}`,
        fit.condition && `${t("fit.condition")}: ${fit.condition === "new" || fit.condition === "used" || fit.condition === "refurbished" ? t(`fit.condition.${fit.condition}`) : fit.condition}`,
        fit.truck && `${t("fit.truck")}: ${fit.truck}`,
        fit.ceiling && `${t("fit.ceiling")}: ${fit.ceiling}`,
        fit.allowed_goods && `${t("fit.allowed")}: ${fit.allowed_goods}`,
        fit.delivery_note && `${t("fit.deliveryNote")}: ${fit.delivery_note}`,
        fit.license_note && `${t("fit.license")}: ${fit.license_note}`,
      ].filter(Boolean).map((line) => <p key={String(line)} className="fit-note">{line}</p>)}
      <div className="fit-actions">
        <a className="btn-secondary" href={map} target="_blank" rel="noreferrer">{t("fit.maps")}</a>
        {wa ? (
          <a className="btn-secondary" href={`https://wa.me/${waNumber(wa)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
            {t("fit.shareLoc")}
          </a>
        ) : null}
      </div>
      {config ? <p className="fit-note">{config.safety[lang]}</p> : null}

      {!mine && item.category === "apartment_airbnb" ? (
        <div className="fit-form">
          <p className="detail-heading">{t("fit.book")}</p>
          <div className="wizard-row">
            <label className="wizard-field">
              <span className="wizard-label">{t("fit.checkin")}</span>
              <input className="wizard-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="wizard-field">
              <span className="wizard-label">{t("fit.checkout")}</span>
              <input className="wizard-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="wizard-field">
            <span className="wizard-label">{t("fit.guests")}</span>
            <input className="wizard-input" inputMode="numeric" value={String(guests)} onChange={(e) => setGuests(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
          </label>
          {stayQuote ? <PriceBreakdown item={item} quote={stayQuote} /> : null}
          {fit.cancellation ? <p className="fit-note">{t(`fit.cancel.${fit.cancellation}`)}</p> : null}
          <div className="fit-actions">
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { void priceStay(); }}>{t("fit.quote")}</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => { void book(); }}>{t("fit.book")}</button>
          </div>
        </div>
      ) : null}

      {!mine && item.category !== "apartment_airbnb" && item.category !== "vifaa" ? (
        <div className="fit-form" id="viewing">
          <p className="detail-heading">{t("fit.viewing")}</p>
          <label className="wizard-field">
            <span className="wizard-label">{t("fit.date")}</span>
            <input className="wizard-input" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </label>
          <div className="wizard-chips">
            {(["morning", "afternoon", "evening"] as const).map((value) => (
              <button key={value} type="button" className={slot === value ? "filter-chip is-on" : "filter-chip"} onClick={() => setSlot(value)}>
                {t(`fit.slot.${value}`)}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary" disabled={busy || !visitDate} onClick={() => { void sendViewing(); }}>
            {t("fit.viewing")}
          </button>
        </div>
      ) : null}

      {!mine && (item.category === "store_godown" && fit.subtype === "godown") ? (
        <div className="fit-form">
          <p className="detail-heading">{t("fit.storeGoods")}</p>
          <input className="wizard-input" value={goods} maxLength={160} onChange={(e) => setGoods(e.target.value)} />
          <label className="wizard-field">
            <span className="wizard-label">{t("fit.date")}</span>
            <input className="wizard-input" type="date" value={storeStart} onChange={(e) => setStoreStart(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || goods.trim().length < 2 || !storeStart}
            onClick={() => {
              setBusy(true);
              void requestStorage(item.id, { goods, start_date: storeStart, months: fit.months_advance || 1 })
                .then((res) => {
                  setSummary(res.summary || { title: item.title, goods, start_date: storeStart });
                  setNote(t("fit.sent"));
                })
                .catch((err) => {
                  setSummary({ title: item.title, goods, start_date: storeStart, price: Number(item.price) || 0 });
                  setNote(err instanceof Error ? err.message : "");
                })
                .finally(() => setBusy(false));
            }}
          >
            {t("cta.request")}
          </button>
          {summary ? (
            <div className="fit-sheet">
              <p className="detail-heading">{t("fit.agreement")}</p>
              {Object.entries(summary).map(([key, value]) => value != null && value !== "" ? <p key={key} className="fit-line"><span>{key}</span><span>{String(value)}</span></p> : null)}
              <p className="fit-note">{t("fit.notLegal")}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {canReview ? (
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void writeReview(item.id, { interaction_id: canReview.id, interaction_kind: canReview.kind, ratings: { overall: 5 }, body: "" })
              .then(() => setNote(t("fit.reviewSent")))
              .catch((err) => setNote(err instanceof Error ? err.message : ""))
              .finally(() => setBusy(false));
          }}
        >
          {t("fit.review")}
        </button>
      ) : null}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          const key = "jengo_compare";
          const cur = JSON.parse(sessionStorage.getItem(key) || "[]") as string[];
          const next = [item.id, ...cur.filter((id) => id !== item.id)].slice(0, 3);
          sessionStorage.setItem(key, JSON.stringify(next));
          setNote(t("fit.compared"));
          window.location.href = "/linganisha";
        }}
      >
        {t("fit.compare")}
      </button>
      {mine ? (
        <div className="fit-form">
          <div className="fit-actions">
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { void mark("active"); }}>{t("fit.available")}</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { void mark("rented"); }}>{t("fit.rented")}</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { void mark("paused"); }}>{t("fit.paused")}</button>
          </div>
          {viewings.filter((row) => row.status === "pending").map((row) => (
            <div key={row.id} className="fit-actions">
              <span className="fit-note">{row.visit_date} · {t(`fit.slot.${row.slot}`)}</span>
              <button type="button" className="btn-primary" onClick={() => { void decideViewing(row.id, "accepted").then(() => setViewings((cur) => cur.map((item) => item.id === row.id ? { ...item, status: "accepted" } : item))); }}>{t("fit.accept")}</button>
              <button type="button" className="btn-secondary" onClick={() => { void decideViewing(row.id, "declined").then(() => setViewings((cur) => cur.map((item) => item.id === row.id ? { ...item, status: "declined" } : item))); }}>{t("fit.decline")}</button>
            </div>
          ))}
          {stays.filter((row) => row.status === "pending" || row.status === "confirmed").map((row) => (
            <div key={row.id} className="fit-actions">
              <span className="fit-note">{row.start_date} → {row.end_date}</span>
              {row.status === "pending" ? <button type="button" className="btn-primary" onClick={() => { void decideStay(row.id, "confirmed").then(() => setStays((cur) => cur.map((item) => item.id === row.id ? { ...item, status: "confirmed" } : item))).catch((err) => setNote(err instanceof Error ? err.message : "")); }}>{t("fit.accept")}</button> : null}
              <button type="button" className="btn-secondary" onClick={() => { const next = row.status === "confirmed" ? "completed" : "declined"; void decideStay(row.id, next).then(() => setStays((cur) => cur.map((item) => item.id === row.id ? { ...item, status: next } : item))).catch((err) => setNote(err instanceof Error ? err.message : "")); }}>{row.status === "confirmed" ? t("fit.complete") : t("fit.decline")}</button>
            </div>
          ))}
        </div>
      ) : null}
      {note ? <p className="fit-note">{note}</p> : null}
    </section>
  );
}
