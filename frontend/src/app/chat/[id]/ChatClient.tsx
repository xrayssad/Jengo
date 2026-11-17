"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { ChatThreadSkeleton } from "@/components/Skeletons";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fetchListingDm, sendListingDm, type ChatMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ChatClient({ id, title, peer }: { id: string; title: string; peer?: string }) {
  const router = useRouter();
  const t = useT();
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [heading, setHeading] = useState(title);
  const [verified, setVerified] = useState(false);
  const [kind, setKind] = useState<"individual" | "business" | null>(null);
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    fetchListingDm(id, peer)
      .then((res) => {
        setItems(res.items || []);
        if (res.title) setHeading(res.title);
        setVerified(Boolean(res.is_verified));
        setKind(res.verified_type === "business" || res.verified_type === "individual" ? res.verified_type : null);
        setCategory(res.category || "");
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not open messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const onPing = () => load({ quiet: true });
    window.addEventListener("jengo-chat", onPing);
    const t = window.setInterval(() => {
      if (!window.__jengoMqtt) load({ quiet: true });
    }, 12000);
    return () => {
      window.removeEventListener("jengo-chat", onPing);
      window.clearInterval(t);
    };
  }, [id, peer]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    try {
      const msg = await sendListingDm(id, t, peer);
      setItems((cur) => [...cur, msg]);
      setText("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message was not sent");
    }
  };

  return (
    <AuthGate>
      <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas-read flex items-center gap-3 px-5">
            <button type="button" onClick={() => router.back()} className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} color="var(--ink)" />
            </button>
            <div className="min-w-0">
              <h1 className="name-line text-lg font-bold" style={{ color: "var(--ink)" }}>
                <span className="truncate">{heading}</span>
                {verified ? <VerifiedBadge size="md" type={kind} /> : null}
              </h1>
              <p className="page-note">Direct message</p>
            </div>
          </div>
        </header>
        {loading ? (
          <ChatThreadSkeleton />
        ) : (
          <div className="flex-1 canvas-read w-full px-5 py-4 space-y-2">
            {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
            {items.some((m) => !m.mine && /mpesa|m-pesa|tigo\s*pesa|airtel\s*money|lipa|tuma pesa|akaunti|send money/i.test(m.body || "")) ? (
              <p className="fit-note">{t("fit.payWarning")}</p>
            ) : null}
            {category === "plots" && items.some((m) => /mpesa|m-pesa|tigo\s*pesa|airtel|lipa|pesa|payment|deposit|advance|akaunti|send money|tuma/i.test(m.body || "")) ? (
              <p className="fit-note">{t("plot.chatWarning")}</p>
            ) : null}
            {items.length === 0 && !error && (
              <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>Write a direct message to the listing owner.</p>
            )}
            {items.map((m) => (
              <div key={m.id} className="flex" style={{ justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-[18px] text-sm"
                  style={
                    m.mine
                      ? { backgroundColor: "var(--ink)", color: "var(--paper)", boxShadow: "var(--shadow-quiet)" }
                      : { backgroundColor: "var(--surface)", color: "var(--ink)", border: "1px solid rgba(var(--caramel-rgb),0.22)", boxShadow: "var(--shadow-quiet)" }
                  }
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="sticky bottom-0 px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="nav-island canvas-read w-full px-3 py-2 flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto">
              {(["fit.quick.view", "fit.quick.where", "fit.quick.cost"] as const).map((key) => (
                <button key={key} type="button" className="filter-chip shrink-0" onClick={() => setText(t(key))}>{t(key)}</button>
              ))}
            </div>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" style={{ color: "var(--ink)" }} />
            <button
              type="submit"
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--ink)", boxShadow: "var(--shadow-float)" }}
              aria-label="Send message"
            >
              <Send size={18} color="var(--paper)" />
            </button>
          </div>
        </form>
      </main>
    </AuthGate>
  );
}
