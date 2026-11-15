"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import VerifiedBadge from "@/components/VerifiedBadge";
import { faceVisible, prepImage, qualityHint } from "@/lib/docScan";
import { useT } from "@/lib/i18n";
import {
  fetchEligibility,
  fetchVerificationMe,
  patchVerificationProfile,
  submitVerification,
  uploadAvatar,
  uploadPrivate,
  type Eligibility,
  type VerificationState,
} from "@/lib/trust";

const INDIVIDUAL = ["nida", "passport", "driving_licence", "voter_card"] as const;
const BUSINESS = ["business_license", "tin"] as const;
type Kind = "individual" | "business";
type Slot = "front" | "back" | "selfie" | "business" | "shop";
type Hint = "" | "blur" | "dark" | "bright" | "glare" | "face";
type Shot = { url: string; blob: Blob };

async function assess(file: Blob, kind: "doc" | "selfie"): Promise<{ blob: Blob; hint: Hint }> {
  const stats = await prepImage(file);
  const code = qualityHint(stats, kind);
  if (code) return { blob: stats.blob, hint: code };
  if (kind === "selfie") {
    const face = await faceVisible(stats.blob);
    if (face === false) return { blob: stats.blob, hint: "face" };
  }
  return { blob: stats.blob, hint: "" };
}

function Ring({ value }: { value: number }) {
  const length = 2 * Math.PI * 14;
  return (
    <svg className="progress-ring" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface-2)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r="14"
        fill="none"
        stroke="var(--verified-blue)"
        strokeWidth="3"
        strokeDasharray={`${length}`}
        strokeDashoffset={`${length * (1 - Math.max(0, Math.min(1, value)))}`}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

function Capture({
  label,
  kind,
  shot,
  hint,
  onShot,
}: {
  label: string;
  kind: "doc" | "selfie";
  shot: Shot | null;
  hint: Hint;
  onShot: (shot: Shot | null, hint: Hint) => void;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!live || !videoRef.current || !stream.current) return;
    videoRef.current.srcObject = stream.current;
    void videoRef.current.play().catch(() => {});
  }, [live]);

  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setLive(false);
  };

  const accept = async (file: Blob) => {
    const result = await assess(file, kind);
    if (result.hint) {
      onShot(null, result.hint);
      return;
    }
    onShot({ url: URL.createObjectURL(result.blob), blob: result.blob }, "");
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click();
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: kind === "selfie" ? "user" : "environment" },
      });
      stream.current = media;
      setLive(true);
    } catch {
      fileRef.current?.click();
    }
  };

  const snap = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((out) => resolve(out), "image/jpeg", 0.92));
    stop();
    if (blob) await accept(blob);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
      {live ? (
        <div className="scan-stage">
          <video ref={videoRef} playsInline muted />
          <span className={kind === "selfie" ? "scan-frame is-face" : "scan-frame"} />
        </div>
      ) : shot ? (
        <div className="scan-stage">
          <img src={shot.url} alt="" />
        </div>
      ) : null}
      {hint ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{t(`verify.quality.${hint}`)}</p> : null}
      <div className="scan-actions">
        {live ? (
          <button type="button" className="btn-primary px-4" onClick={() => void snap()}>{t("verify.snap")}</button>
        ) : (
          <button type="button" className="btn-primary px-4" onClick={() => void openCamera()}>{t("verify.capture")}</button>
        )}
        <button type="button" className="btn-secondary px-4" onClick={() => fileRef.current?.click()}>
          {shot ? t("verify.retake") : t("verify.file")}
        </button>
        {live ? <button type="button" className="btn-secondary px-4" onClick={stop}>{t("close")}</button> : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={kind === "selfie" ? "user" : "environment"}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void accept(file);
        }}
      />
    </div>
  );
}

function Hakiki() {
  const t = useT();
  const [gate, setGate] = useState<Eligibility | null>(null);
  const [me, setMe] = useState<VerificationState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"status" | "intro" | "type" | "docs" | "consent" | "send">("intro");
  const [kind, setKind] = useState<Kind>("individual");
  const [doc, setDoc] = useState("nida");
  const [legal, setLegal] = useState("");
  const [number, setNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [shots, setShots] = useState<Partial<Record<Slot, Shot>>>({});
  const [hints, setHints] = useState<Partial<Record<Slot, Hint>>>({});
  const [progress, setProgress] = useState<Partial<Record<Slot, number>>>({});
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [eligibility, state] = await Promise.all([fetchEligibility(), fetchVerificationMe()]);
    setGate(eligibility);
    setMe(state);
    const status = state.request?.status;
    if (status === "pending" || status === "approved" || status === "rejected" || status === "revoked" || status === "needs_review") {
      setStep("status");
    }
  };

  useEffect(() => {
    let stop = false;
    load()
      .catch((err) => {
        if (!stop) setError(err instanceof Error ? err.message : t("loading"));
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [t]);

  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  useEffect(() => () => {
    Object.values(shotsRef.current).forEach((shot) => {
      if (shot) URL.revokeObjectURL(shot.url);
    });
  }, []);

  const putShot = (slot: Slot, shot: Shot | null, hint: Hint) => {
    setShots((cur) => {
      const prev = cur[slot];
      if (prev) URL.revokeObjectURL(prev.url);
      const next = { ...cur };
      if (shot) next[slot] = shot;
      else delete next[slot];
      return next;
    });
    setHints((cur) => ({ ...cur, [slot]: hint }));
  };

  const saveProfile = async () => {
    setBusy(true);
    setError("");
    try {
      const next = await patchVerificationProfile({ full_name: fullName.trim(), phone: phone.trim() });
      setGate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("verify.fix"));
    } finally {
      setBusy(false);
    }
  };

  const savePhoto = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const stats = await prepImage(file);
      const next = await uploadAvatar(stats.blob);
      setGate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("verify.fix"));
    } finally {
      setBusy(false);
    }
  };

  const needBack = kind === "individual" && doc !== "passport";
  const readyDocs = Boolean(shots.front) && (kind === "business" ? Boolean(shots.business) : Boolean(shots.selfie)) && (!needBack || Boolean(shots.back));
  const docs = kind === "individual" ? INDIVIDUAL : BUSINESS;

  const sendSlot = async (slot: Slot, blob: Blob) => {
    try {
      return await uploadPrivate(slot, blob, (value) => setProgress((cur) => ({ ...cur, [slot]: value })));
    } catch {
      return uploadPrivate(slot, blob, (value) => setProgress((cur) => ({ ...cur, [slot]: value })));
    }
  };

  const submit = async () => {
    if (!consent || !readyDocs || legal.trim().length < 2 || number.trim().length < 4) return;
    setBusy(true);
    setError("");
    setStep("send");
    try {
      const keys: Partial<Record<Slot, string>> = {};
      const entries = Object.entries(shots) as [Slot, Shot][];
      for (const [slot, shot] of entries) {
        const saved = await sendSlot(slot, shot.blob);
        keys[slot] = saved.key;
        setProgress((cur) => ({ ...cur, [slot]: 1 }));
      }
      const request = await submitVerification({
        type: kind,
        legal_name: legal.trim(),
        doc_type: doc,
        document_number: number.trim(),
        front_key: keys.front || "",
        back_key: keys.back || null,
        selfie_key: keys.selfie || null,
        business_doc_key: keys.business || null,
        shop_key: keys.shop || null,
        consent: true,
      });
      setNumber("");
      setMe((cur) => ({
        is_verified: Boolean(request?.is_verified),
        verified_type: request?.verified_type || null,
        request,
      }));
      setStep("status");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("verify.rejected"));
      setStep("consent");
    } finally {
      setBusy(false);
    }
  };

  const status = me?.request?.status;
  const reason = me?.request?.reason_code ? t(`verify.reason.${me.request.reason_code}`) : "";

  return (
    <main className="verify-page min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/profile" className="soft-icon-btn shrink-0" aria-label={t("back")}>
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <h1 className="page-title">{t("verify.title")}</h1>
        </div>
      </header>
      <div className="canvas-read px-5 py-6 space-y-4">
        {error ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p> : null}
        {loading ? <p className="text-sm" style={{ color: "var(--muted)" }}>{t("loading")}</p> : null}

        {!loading && step === "status" && status === "approved" ? (
          <section className="sheet p-5 space-y-3">
            <VerifiedBadge size="lg" type={me?.verified_type} shine />
            <p className="text-sm" style={{ color: "var(--text)" }}>{t("verify.approved")}</p>
          </section>
        ) : null}

        {!loading && step === "status" && status === "pending" ? (
          <section className="sheet p-5">
            <p className="font-semibold" style={{ color: "var(--text)" }}>{t("loading")}</p>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{t("verify.pending")}</p>
          </section>
        ) : null}

        {!loading && step === "status" && (status === "rejected" || status === "revoked" || status === "needs_review") ? (
          <section className="sheet p-5 space-y-3">
            <p className="font-semibold" style={{ color: "var(--text)" }}>
              {status === "revoked" ? t("verify.revoked") : t("verify.rejected")}
            </p>
            {reason && reason !== `verify.reason.${me?.request?.reason_code}` ? <p className="text-sm">{reason}</p> : null}
            {me?.request?.revoked_reason ? <p className="text-sm">{me.request.revoked_reason}</p> : null}
            <p className="text-sm" style={{ color: "var(--muted)" }}>{status === "revoked" ? t("verify.support") : me?.request?.retry_at ? t("verify.cooldown") : ""}</p>
            {!me?.request?.retry_at ? (
              <button type="button" className="btn-primary px-5" onClick={() => setStep("intro")}>{t("verify.retry")}</button>
            ) : null}
          </section>
        ) : null}

        {!loading && step === "intro" ? (
          <section className="space-y-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>{t("verify.lead")}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{t("badge.free")}</p>
            <div>
              {(gate?.items || []).map((item) => (
                <div key={item.id} id={item.id} className={item.ok ? "verify-check is-ok" : "verify-check"}>
                  <span className="text-sm">{item.id === "age" ? t("verify.age", { n: gate?.min_days || 7 }) : t(`verify.${item.id}`)}</span>
                  <span className="text-xs font-semibold">{item.ok ? "✓" : item.href ? <Link href={item.href}>{t("verify.fix")}</Link> : ""}</span>
                </div>
              ))}
            </div>
            <div id="photo" className="space-y-2">
              <p className="text-sm font-semibold">{t("verify.photo")}</p>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void savePhoto(file);
                }}
              />
            </div>
            <div id="name">
              <label className="block text-sm font-semibold" htmlFor="verify-name">{t("verify.name")}</label>
              <input id="verify-name" className="input-chocolate w-full px-4 py-3 text-sm" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div id="phone">
              <label className="block text-sm font-semibold" htmlFor="verify-phone">{t("verify.phone")}</label>
              <input id="verify-phone" className="input-chocolate w-full px-4 py-3 text-sm" value={phone} inputMode="tel" onChange={(event) => setPhone(event.target.value)} />
            </div>
            <button type="button" className="btn-secondary px-5" disabled={busy} onClick={() => void saveProfile()}>{t("verify.save")}</button>
            <button type="button" className="btn-primary w-full" disabled={!gate?.eligible || busy} onClick={() => setStep("type")}>{t("verify.start")}</button>
          </section>
        ) : null}

        {step === "type" ? (
          <section className="space-y-3">
            <button type="button" className={kind === "individual" ? "verify-choice is-on" : "verify-choice"} onClick={() => { setKind("individual"); setDoc("nida"); }}>{t("verify.individual")}</button>
            <button type="button" className={kind === "business" ? "verify-choice is-on" : "verify-choice"} onClick={() => { setKind("business"); setDoc("business_license"); }}>{t("verify.business")}</button>
            <button type="button" className="btn-primary w-full" onClick={() => setStep("docs")}>{t("wizard.next")}</button>
          </section>
        ) : null}

        {step === "docs" ? (
          <section className="space-y-4">
            <label className="block text-sm font-semibold" htmlFor="verify-doc">{t("verify.legal")}</label>
            <select id="verify-doc" className="input-chocolate w-full px-4 py-3 text-sm" value={doc} onChange={(event) => setDoc(event.target.value)}>
              {docs.map((item) => <option key={item} value={item}>{t(`verify.doc.${item}`)}</option>)}
            </select>
            <input className="input-chocolate w-full px-4 py-3 text-sm" value={legal} placeholder={t("verify.legal")} onChange={(event) => setLegal(event.target.value)} />
            <input className="input-chocolate w-full px-4 py-3 text-sm" value={number} placeholder={t("verify.number")} autoComplete="off" onChange={(event) => setNumber(event.target.value)} />
            <p className="text-xs" style={{ color: "var(--muted)" }}>{t("verify.numberHint")}</p>
            <Capture label={kind === "business" ? t("verify.ownerId") : t("verify.front")} kind="doc" shot={shots.front || null} hint={hints.front || ""} onShot={(shot, hint) => putShot("front", shot, hint)} />
            {needBack ? <Capture label={t("verify.back")} kind="doc" shot={shots.back || null} hint={hints.back || ""} onShot={(shot, hint) => putShot("back", shot, hint)} /> : null}
            {kind === "individual" ? <Capture label={t("verify.selfie")} kind="selfie" shot={shots.selfie || null} hint={hints.selfie || ""} onShot={(shot, hint) => putShot("selfie", shot, hint)} /> : null}
            {kind === "business" ? <Capture label={t("verify.bizdoc")} kind="doc" shot={shots.business || null} hint={hints.business || ""} onShot={(shot, hint) => putShot("business", shot, hint)} /> : null}
            {kind === "business" ? <Capture label={t("verify.shop")} kind="doc" shot={shots.shop || null} hint={hints.shop || ""} onShot={(shot, hint) => putShot("shop", shot, hint)} /> : null}
            <button type="button" className="btn-primary w-full" disabled={!readyDocs || legal.trim().length < 2 || number.trim().length < 4} onClick={() => setStep("consent")}>{t("wizard.next")}</button>
          </section>
        ) : null}

        {step === "consent" || step === "send" ? (
          <section className="space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>{t("verify.consent")}</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {(Object.keys(shots) as Slot[]).map((slot) => (
                <span key={slot} className="inline-flex items-center gap-2 text-xs">
                  <Ring value={progress[slot] || 0} />
                  {slot}
                </span>
              ))}
            </div>
            <button type="button" className="btn-primary w-full" disabled={!consent || busy} onClick={() => void submit()}>
              {busy ? t("loading") : t("verify.submit")}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function HakikiPage() {
  return (
    <AuthGate>
      <Hakiki />
    </AuthGate>
  );
}
