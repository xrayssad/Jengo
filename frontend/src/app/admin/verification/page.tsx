"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { useT } from "@/lib/i18n";
import {
  decideVerification,
  fetchVerificationDetail,
  fetchVerificationQueue,
  grantBadge,
  revokeBadge,
  type QueueItem,
  type ReviewDetail,
} from "@/lib/trust";

const REASONS = ["blurry", "name_mismatch", "expired", "unsupported_document", "suspected_fake"] as const;

function Desk() {
  const t = useT();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [checks, setChecks] = useState({ photo: false, doc: false, type: false });
  const [confirmFace, setConfirmFace] = useState(false);
  const [grantNote, setGrantNote] = useState("");
  const [grantKind, setGrantKind] = useState<"individual" | "business">("individual");
  const [revokeNote, setRevokeNote] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadQueue = async (next = status) => {
    const res = await fetchVerificationQueue(next);
    setItems(res.items || []);
  };

  useEffect(() => {
    loadQueue(status).catch((err) => setError(err instanceof Error ? err.message : t("loading")));
  }, [status, t]);

  const open = async (id: string) => {
    setError("");
    setNote("");
    setChecks({ photo: false, doc: false, type: false });
    setConfirmFace(false);
    try {
      setDetail(await fetchVerificationDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loading"));
    }
  };

  const decide = async (action: "approve" | "reject") => {
    if (!detail?.request.id) return;
    setBusy(true);
    setError("");
    try {
      await decideVerification(detail.request.id, {
        action,
        reason_code: action === "reject" ? reason : "",
        note: note.trim(),
        confirm_face: confirmFace,
      });
      setDetail(null);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loading"));
    } finally {
      setBusy(false);
    }
  };

  const grant = async () => {
    if (!detail) return;
    setBusy(true);
    setError("");
    try {
      await grantBadge(detail.request.user_id, { note: grantNote.trim(), verified_type: grantKind });
      setGrantNote("");
      await open(detail.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loading"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!detail) return;
    setBusy(true);
    setError("");
    try {
      await revokeBadge(detail.request.user_id, { note: revokeNote.trim(), reason: revokeReason.trim() });
      setRevokeNote("");
      setRevokeReason("");
      await open(detail.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loading"));
    } finally {
      setBusy(false);
    }
  };

  const face = detail?.face_check;
  const faceBlocks = face?.verdict === "mismatch" && !confirmFace;
  const canApprove = Boolean(detail?.name_match && checks.photo && checks.doc && checks.type && note.trim().length >= 3 && !faceBlocks);

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      <header className="topbar">
        <div className="max-w-5xl mx-auto px-5 flex items-center gap-3">
          <Link href="/admin" className="soft-icon-btn shrink-0" aria-label={t("back")}>
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div>
            <h1 className="page-title">{t("desk.verify")}</h1>
            <p className="page-note">{t("review.queue")}</p>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-5 py-5 space-y-4">
        {error ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p> : null}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["pending", "approved", "rejected", "flagged"].map((item) => (
            <button key={item} type="button" className={status === item ? "filter-chip is-on" : "filter-chip"} onClick={() => { setStatus(item); setDetail(null); }}>
              {item}
            </button>
          ))}
        </div>
        {!detail ? (
          items.length === 0 ? <p className="text-sm" style={{ color: "var(--muted)" }}>{t("review.empty")}</p> : (
            <div className="space-y-2">
              {items.map((item) => (
                <button key={item.id} type="button" className="sheet w-full text-left p-4" onClick={() => void open(item.id)}>
                  <p className="text-sm font-semibold">{item.legal_name}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    {item.type} · {item.doc_type} · {item.status}
                    {item.face_check?.verdict ? ` · ${t(`review.face.${item.face_check.verdict}`)}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : (
          <section className="space-y-4">
            <button type="button" className="text-sm font-semibold" onClick={() => setDetail(null)}>{t("back")}</button>
            <p className="text-lg font-semibold">{detail.request.legal_name}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {detail.profile_name} {detail.profile_username ? `@${detail.profile_username}` : ""}
            </p>
            <div className="review-grid">
              {Object.entries(detail.photos).filter(([, url]) => url).map(([name, url]) => (
                <figure key={name} className="review-photo">
                  <img src={url || ""} alt="" draggable={false} />
                  <span className="review-mark">{detail.reviewer_id}</span>
                  <figcaption className="sr-only">{name}</figcaption>
                </figure>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{detail.expires_in}s</p>
            {face ? (
              <div className="sheet p-4 space-y-2">
                <p className="text-sm font-semibold">{t(`review.face.${face.verdict}`)}</p>
                {face.reasons.length ? (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {face.reasons.map((code) => t(`review.face.reason.${code}`)).join(" · ")}
                  </p>
                ) : null}
                {face.verdict === "mismatch" ? (
                  <label className="flex items-center gap-2 text-sm min-h-[44px]">
                    <input type="checkbox" checked={confirmFace} onChange={(event) => setConfirmFace(event.target.checked)} />
                    {t("review.face.confirm")}
                  </label>
                ) : null}
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={detail.name_match} readOnly disabled />
              {t("review.name")}
            </label>
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={checks.photo} onChange={(event) => setChecks((cur) => ({ ...cur, photo: event.target.checked }))} />
              {t("review.photo")}
            </label>
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={checks.doc} onChange={(event) => setChecks((cur) => ({ ...cur, doc: event.target.checked }))} />
              {t("review.doc")}
            </label>
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={checks.type} onChange={(event) => setChecks((cur) => ({ ...cur, type: event.target.checked }))} />
              {t("review.type")}
            </label>
            <textarea className="input-chocolate w-full px-4 py-3 text-sm" rows={3} value={note} placeholder={t("review.note")} onChange={(event) => setNote(event.target.value)} />
            <select className="input-chocolate w-full px-4 py-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)}>
              {REASONS.map((item) => <option key={item} value={item}>{t(`verify.reason.${item}`)}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" className="btn-primary flex-1" disabled={!canApprove || busy || detail.request.status !== "pending"} onClick={() => void decide("approve")}>{t("review.approve")}</button>
              <button type="button" className="btn-secondary flex-1" disabled={busy || note.trim().length < 3 || detail.request.status !== "pending"} onClick={() => void decide("reject")}>{t("review.reject")}</button>
            </div>
            <div className="sheet p-4 space-y-3">
              <p className="text-sm font-semibold">{t("review.grant")}</p>
              <select className="input-chocolate w-full px-4 py-3 text-sm" value={grantKind} onChange={(event) => setGrantKind(event.target.value === "business" ? "business" : "individual")}>
                <option value="individual">{t("verify.individual")}</option>
                <option value="business">{t("verify.business")}</option>
              </select>
              <input className="input-chocolate w-full px-4 py-3 text-sm" value={grantNote} placeholder={t("review.note")} onChange={(event) => setGrantNote(event.target.value)} />
              <button type="button" className="btn-primary px-4" disabled={busy || grantNote.trim().length < 8} onClick={() => void grant()}>{t("review.grant")}</button>
            </div>
            <div className="sheet p-4 space-y-3">
              <p className="text-sm font-semibold">{t("review.revoke")}</p>
              <input className="input-chocolate w-full px-4 py-3 text-sm" value={revokeReason} placeholder={t("review.reason")} onChange={(event) => setRevokeReason(event.target.value)} />
              <input className="input-chocolate w-full px-4 py-3 text-sm" value={revokeNote} placeholder={t("review.note")} onChange={(event) => setRevokeNote(event.target.value)} />
              <button type="button" className="btn-secondary px-4" disabled={busy || revokeNote.trim().length < 8 || revokeReason.trim().length < 3} onClick={() => void revoke()}>{t("review.revoke")}</button>
            </div>
            <ul className="space-y-2">
              {detail.audit.map((row) => (
                <li key={row.id} className="text-xs" style={{ color: "var(--muted)" }}>
                  {row.created_at} · {row.action} {row.reason_code || ""} {row.note || ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

export default function VerificationDeskPage() {
  return (
    <AuthGate admin>
      <Desk />
    </AuthGate>
  );
}
