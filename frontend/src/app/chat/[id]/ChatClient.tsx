"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { fetchListingDm, sendListingDm, type ChatMessage } from "@/lib/api";

export default function ChatClient({ id, title, peer }: { id: string; title: string; peer?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [heading, setHeading] = useState(title);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetchListingDm(id, peer)
      .then((res) => {
        setItems(res.items || []);
        if (res.title) setHeading(res.title);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not open messages"));
  };

  useEffect(() => {
    load();
    const onPing = () => load();
    window.addEventListener("jengo-chat", onPing);
    const t = window.setInterval(() => {
      if (!window.__jengoMqtt) load();
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
        <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 glass">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading truncate" style={{ color: "var(--ink)" }}>{heading}</h1>
            <p className="text-xs" style={{ color: "var(--mocha)" }}>Direct message</p>
          </div>
        </header>
        <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-2">
          {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
          {items.length === 0 && !error && (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>Write a direct message to the listing owner.</p>
          )}
          {items.map((m) => (
            <div key={m.id} className="flex" style={{ justifyContent: m.mine ? "flex-end" : "flex-start" }}>
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-[18px] text-sm"
                style={{ backgroundColor: m.mine ? "var(--ink)" : "rgba(var(--paper-rgb),0.86)", color: m.mine ? "var(--paper)" : "var(--ink)", border: m.mine ? "none" : "1px solid rgba(var(--caramel-rgb),0.4)" }}
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="sticky bottom-0 px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="nav-island max-w-md w-full mx-auto px-3 py-2 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" style={{ color: "var(--ink)" }} />
            <button type="submit" className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--ink)" }} aria-label="Send message">
              <Send size={18} color="var(--paper)" />
            </button>
          </div>
        </form>
      </main>
    </AuthGate>
  );
}
