"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { ChatListSkeleton } from "@/components/Skeletons";
import { fetchInbox, peekInbox, type ChatMessage } from "@/lib/api";
import { useInboxLive } from "@/components/MqttInbox";

export default function MessagesPage() {
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const inbox = useInboxLive();

  useLayoutEffect(() => {
    const cached = peekInbox();
    if (!cached.length) return;
    setItems(cached);
    setLoading(false);
  }, []);

  const load = (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet && peekInbox().length === 0) setLoading(true);
    fetchInbox()
      .then((res) => {
        setItems(res.items || []);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not open messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    inbox.clear();
    const onPing = () => {
      load({ quiet: true });
      inbox.clear();
    };
    window.addEventListener("jengo-chat", onPing);
    return () => window.removeEventListener("jengo-chat", onPing);
  }, []);

  return (
    <AuthGate>
      <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas-read px-5">
            <h1 className="page-title">Messages</h1>
            <p className="page-note">Direct messages and request chats</p>
          </div>
        </header>
        <div className="canvas-read px-5 pt-5 space-y-3">
          {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
          {loading && items.length === 0 && <ChatListSkeleton />}
          {!loading && items.length === 0 && !error && (
            <div className="empty-panel">
              <Send size={28} color="var(--caramel)" className="mx-auto mb-3" />
              <p className="lead">No messages</p>
              <p className="hint">Open a listing, then send a direct message.</p>
            </div>
          )}
          {items.map((c) => (
            <Link key={c.thread_key || c.id} href={c.href || "/messages"} className="sheet block p-4">
              <p className="text-xs font-semibold" style={{ color: "var(--mocha)" }}>
                {c.kind === "booking" ? "Request" : "Direct message"}
              </p>
              <h2 className="text-lg font-bold mt-1" style={{ color: "var(--ink)" }}>{c.title || "Message"}</h2>
              <p className="text-sm truncate mt-1" style={{ color: "var(--muted)" }}>{c.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </AuthGate>
  );
}
