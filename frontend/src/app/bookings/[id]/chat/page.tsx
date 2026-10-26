"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { fetchBookingMessages, sendBookingMessage, type ChatMessage } from "@/lib/api";

function Thread() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetchBookingMessages(id)
      .then((res) => setItems(res.items || []))
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
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    try {
      const msg = await sendBookingMessage(id, t);
      setItems((cur) => [...cur, msg]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message was not sent");
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 glass">
        <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
          <ArrowLeft size={18} color="var(--ink)" />
        </button>
        <div>
          <h1 className="font-heading" style={{ color: "var(--ink)" }}>Write a message</h1>
          <p className="text-xs" style={{ color: "var(--mocha)" }}>Buyer and seller only</p>
        </div>
      </header>
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-2">
        {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
        {items.length === 0 && !error && (
          <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>Start this request chat.</p>
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
  );
}

export default function BookingChatPage() {
  return (
    <AuthGate>
      <Thread />
    </AuthGate>
  );
}
