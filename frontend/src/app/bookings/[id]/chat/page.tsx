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

  useEffect(() => {
    fetchBookingMessages(id)
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Ujumbe haujafunguka"));
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
      setError(err instanceof Error ? err.message : "Ujumbe haukuenda");
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 glass">
        <button type="button" onClick={() => router.back()} className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center">
          <ArrowLeft size={18} color="#2E1A0F" />
        </button>
        <div>
          <h1 className="font-heading" style={{ color: "#2E1A0F" }}>Andika ujumbe</h1>
          <p className="text-xs" style={{ color: "#8B5E3C" }}>Mnunuzi na muuzaji tu</p>
        </div>
      </header>
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-2">
        {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
        {items.length === 0 && !error && (
          <p className="text-sm text-center py-10" style={{ color: "#5C4033" }}>Anza mazungumzo ya ombi hili.</p>
        )}
        {items.map((m) => (
          <div key={m.id} className="flex" style={{ justifyContent: m.mine ? "flex-end" : "flex-start" }}>
            <div
              className="max-w-[80%] px-3.5 py-2.5 rounded-[18px] text-sm"
              style={{ backgroundColor: m.mine ? "#2E1A0F" : "white", color: m.mine ? "#FFF6ED" : "#2E1A0F", border: m.mine ? "none" : "1px solid rgba(46,26,15,0.12)" }}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="sticky bottom-0 px-4 py-3 flex gap-2 max-w-md w-full mx-auto" style={{ backgroundColor: "#FFF6ED", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Andika ujumbe..." className="input-chocolate flex-1 px-4 py-3 text-sm" />
        <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2E1A0F" }}>
          <Send size={18} color="#FFF6ED" />
        </button>
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
