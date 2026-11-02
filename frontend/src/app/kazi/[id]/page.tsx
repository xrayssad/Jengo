"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Hammer, Loader2, MapPin } from "lucide-react";
import AppAlert, { type AlertKind } from "@/components/AppAlert";
import PhotoGallery from "@/components/PhotoGallery";
import { awardJob, createJobOffer, fetchJob, formatPrice, getAuthUser, type Job, type JobOffer } from "@/lib/api";

function feeCopy(job: Job) {
  const fee = formatPrice(job.connection_fee || 0);
  const size = job.fee_label || "ndogo";
  const range = job.fee_range || "3000–5000";
  return `Ada ya kuunganisha: TSh ${fee} (kazi ${size}, TSh ${range}).`;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<JobOffer | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const [userId, setUserId] = useState("");
  const mine = Boolean(userId && job?.owner_id && userId === job.owner_id);
  const open = (job?.status || "open") === "open";

  const show = (kind: AlertKind, titleText: string, msg?: string) => {
    setAlertKind(kind);
    setAlertTitle(titleText);
    setAlertMsg(msg || "");
    setAlertOpen(true);
  };

  const load = async () => {
    const next = await fetchJob(id);
    setJob(next);
    setError("");
  };

  useEffect(() => {
    setUserId(getAuthUser()?.user_id || "");
  }, []);

  useEffect(() => {
    let stop = false;
    if (!id) return;
    (async () => {
      try {
        const next = await fetchJob(id);
        if (!stop) setJob(next);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Kazi haikupatikana");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [id]);

  const sendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getAuthUser()) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await createJobOffer(id, {
        worker_name: name.trim(),
        contact: contact.trim(),
        amount: Number(amount),
        message: message.trim(),
      });
      setName("");
      setContact("");
      setAmount("");
      setMessage("");
      await load();
      show("success", "Ofa imetumwa", "Mteja ataona jina, simu, kiasi na ujumbe wako.");
    } catch (err) {
      show("error", "Imeshindwa kutuma ofa", err instanceof Error ? err.message : "Jaribu tena.");
    } finally {
      setBusy(false);
    }
  };

  const confirmAward = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      const next = await awardJob(id, pick.id);
      setJob(next);
      setPick(null);
      show("success", "Fundi amechaguliwa", `${feeCopy(next)} Wasiliana na fundi sasa.`);
    } catch (err) {
      show("error", "Imeshindwa kuchagua", err instanceof Error ? err.message : "Jaribu tena.");
    } finally {
      setBusy(false);
    }
  };

  const place = [job?.location, job?.city].filter(Boolean).join(", ");
  const photos = (job?.images || []).filter(Boolean);
  const offers = job?.offers || [];

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/kazi" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl leading-none truncate" style={{ color: "var(--ink)" }}>{job?.title || "Kazi"}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Kazi za Ujenzi</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" color="var(--mocha)" />
          </div>
        )}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="font-heading" style={{ color: "var(--ink)" }}>{error}</p>
          </div>
        )}
        {job && (
          <>
            <PhotoGallery
              images={photos}
              fallback={
                <div className="estate-card flex items-center justify-center" style={{ height: 180, background: "linear-gradient(165deg, var(--blush), var(--cream))" }}>
                  <Hammer size={32} color="var(--mocha)" />
                </div>
              }
            />
            <div className="sheet rounded-[28px] p-5 space-y-2">
              <p className="font-heading text-[28px] leading-none" style={{ color: "var(--ink)" }}>TSh {formatPrice(job.budget)}</p>
              {place ? (
                <p className="flex items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
                  <MapPin size={13} color="var(--mocha)" />
                  {place}
                </p>
              ) : null}
              {job.deadline ? <p className="text-sm" style={{ color: "var(--muted)" }}>Mwisho: {job.deadline}</p> : null}
              {job.description ? <p className="text-sm leading-relaxed pt-1" style={{ color: "var(--ink)" }}>{job.description}</p> : null}
              <p className="text-xs pt-2" style={{ color: "var(--mocha)" }}>
                {open
                  ? (job.offers_count ? feeCopy(job) : "Ada hailipwi mpaka fundi apatikane na ukubali.")
                  : job.status === "awarded"
                    ? `${feeCopy(job)} Fundi ameshachaguliwa.`
                    : "Kazi imefungwa. Hakuna ada."}
              </p>
            </div>

            {mine && (
              <div className="sheet rounded-[28px] p-5 space-y-3">
                <h2 className="font-heading text-xl" style={{ color: "var(--ink)" }}>Ofa za mafundi</h2>
                {offers.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Bado hakuna fundi. Ada ya Jengo hailipwi.</p>
                )}
                {offers.map((offer) => (
                  <div key={offer.id} className="p-3 rounded-[18px]" style={{ border: "1px solid rgba(var(--caramel-rgb),0.4)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm" style={{ color: "var(--ink)" }}>{offer.worker_name}</p>
                        {offer.contact ? <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{offer.contact}</p> : null}
                      </div>
                      <p className="text-sm shrink-0" style={{ color: "var(--ink)" }}>TSh {formatPrice(offer.amount)}</p>
                    </div>
                    {offer.message ? <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{offer.message}</p> : null}
                    {open && offer.status === "submitted" && (
                      <button
                        type="button"
                        onClick={() => setPick(offer)}
                        className="btn-primary w-full mt-3 py-2.5 rounded-full text-sm font-semibold"
                      >
                        Chagua fundi
                      </button>
                    )}
                    {offer.status === "awarded" && (
                      <p className="text-xs mt-2" style={{ color: "var(--success)" }}>Amechaguliwa</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!mine && open && (
              <form onSubmit={sendOffer} className="sheet rounded-[28px] p-5 space-y-3">
                <h2 className="font-heading text-xl" style={{ color: "var(--ink)" }}>Weka ofa</h2>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jina lako" className="input-chocolate w-full px-4 py-3.5 text-sm" />
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Simu" inputMode="tel" className="input-chocolate w-full px-4 py-3.5 text-sm" />
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Kiasi (TSh)" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Ujumbe mfupi" className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" />
                <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 rounded-full text-sm font-semibold" style={{ opacity: busy ? 0.7 : 1 }}>
                  {busy ? "Inatuma..." : "Tuma ofa"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {pick && job && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(26,15,8,0.55)" }} onClick={() => setPick(null)}>
          <div className="w-full max-w-sm sheet rounded-[28px] p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-2xl" style={{ color: "var(--ink)" }}>Thibitisha fundi</h2>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
              {pick.worker_name} · TSh {formatPrice(pick.amount)}
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--ink)" }}>{feeCopy(job)}</p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Ada inalipwa Jengo baada ya kukubali. Si asilimia, si escrow, wala mkataba.
            </p>
            <button type="button" disabled={busy} onClick={confirmAward} className="btn-primary w-full mt-4 py-3.5 rounded-full text-sm font-semibold">
              {busy ? "Inahifadhi..." : "Kubali na chagua"}
            </button>
            <button type="button" onClick={() => setPick(null)} className="btn-secondary w-full mt-2 py-3.5 rounded-full text-sm font-semibold">
              Ghairi
            </button>
          </div>
        </div>
      )}
      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
  );
}
