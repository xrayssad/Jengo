"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ChatListSkeleton } from "@/components/Skeletons";
import SwipeRow from "@/components/SwipeRow";
import { fetchInbox, getAuthUser, peekInbox, type ChatMessage } from "@/lib/api";
import { useInboxLive } from "@/components/MqttInbox";
import MenuButton from "@/components/MenuButton";
import { useT } from "@/lib/i18n";
import { readScoped, writeScoped } from "@/lib/userScope";

const HIDDEN = "inbox_hidden";
const ARCHIVED = "inbox_archived";

function readIds(key: string) {
  try {
    const raw = JSON.parse(readScoped(key) || "[]") as string[];
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set<string>();
  }
}

function writeIds(key: string, ids: Set<string>) {
  try {
    writeScoped(key, JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

export default function MessagesPage() {
  const t = useT();
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState("");
  const undoRef = useRef<(() => void) | null>(null);
  const timer = useRef(0);
  const inbox = useInboxLive();
  const seen = (() => {
    const uid = getAuthUser()?.user_id || "";
    const raw = typeof window === "undefined" ? "" : localStorage.getItem(uid ? `jengo_inbox_seen:${uid}` : "jengo_inbox_seen") || "";
    return Date.parse(raw) || 0;
  })();

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
    setHidden(readIds(HIDDEN));
    setArchived(readIds(ARCHIVED));
    load();
    inbox.clear();
    const onPing = () => {
      load({ quiet: true });
      inbox.clear();
    };
    window.addEventListener("jengo-chat", onPing);
    return () => window.removeEventListener("jengo-chat", onPing);
  }, []);

  const askUndo = (message: string, undo: () => void) => {
    window.clearTimeout(timer.current);
    undoRef.current = () => {
      undo();
      undoRef.current = null;
    };
    setToast(message);
    timer.current = window.setTimeout(() => {
      setToast("");
      undoRef.current = null;
    }, 5000);
  };

  const hideThread = (key: string) => {
    const prev = new Set(hidden);
    const next = new Set(hidden);
    next.add(key);
    setHidden(next);
    writeIds(HIDDEN, next);
    askUndo(t("inbox.hidden"), () => {
      setHidden(prev);
      writeIds(HIDDEN, prev);
    });
  };

  const archiveThread = (key: string) => {
    const prev = new Set(archived);
    const next = new Set(archived);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setArchived(next);
    writeIds(ARCHIVED, next);
    setShowArchived(false);
  };

  const visible = items.filter((item) => {
    const key = item.thread_key || item.id;
    if (hidden.has(key)) return false;
    return showArchived ? archived.has(key) : !archived.has(key);
  });

  return (
    <AuthGate>
      <main className="min-h-screen pb-8" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas-read flex items-center gap-3 px-5">
            <MenuButton />
            <h1 className="page-title">Messages</h1>
            <p className="page-note">Direct messages and request chats</p>
            {archived.size > 0 ? (
              <button type="button" className={showArchived ? "filter-chip is-on mt-3" : "filter-chip mt-3"} aria-pressed={showArchived} onClick={() => setShowArchived((on) => !on)}>
                {t("inbox.archived")}
              </button>
            ) : null}
          </div>
        </header>
        <div className="canvas-read px-5 pt-5 space-y-3">
          {error && <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p>}
          {loading && items.length === 0 && <ChatListSkeleton />}
          {!loading && visible.length === 0 && !error && (
            <div className="empty-panel">
              <Send size={28} color="var(--caramel)" className="mx-auto mb-3" />
              <p className="lead">{showArchived ? t("inbox.archived") : "No messages"}</p>
              <p className="hint">Open a listing, then send a direct message.</p>
            </div>
          )}
          {visible.map((c, index) => {
            const key = c.thread_key || c.id;
            const day = (c.created_at || "").slice(0, 10);
            const prev = (visible[index - 1]?.created_at || "").slice(0, 10);
            const fresh = (Date.parse(c.created_at || "") || 0) > seen;
            return (
              <div key={key}>
                {day && day !== prev ? <p className="day-label">{day}</p> : null}
                <SwipeRow
                  actions={[
                    { id: "archive", label: t("inbox.archive"), onClick: () => archiveThread(key) },
                    { id: "dismiss", label: t("inbox.dismiss"), tone: "danger", onClick: () => hideThread(key) },
                  ]}
                >
                  <Link href={c.href || "/messages"} className="sheet block p-4">
                    <p className="text-xs font-semibold flex items-center gap-2" style={{ color: "var(--mocha)" }}>
                      {fresh ? <i className="unread-dot" aria-label={t("inbox.unread")} /> : null}
                      {c.kind === "booking" ? "Request" : "Direct message"}
                    </p>
                    <h2 className="name-line text-lg font-bold mt-1" style={{ color: "var(--ink)" }}>
                      <span className="truncate">{c.title || "Message"}</span>
                      {c.is_verified ? <VerifiedBadge size="sm" type={c.verified_type} /> : null}
                    </h2>
                    <p className="text-sm truncate mt-1" style={{ color: "var(--muted)" }}>{c.body}</p>
                  </Link>
                </SwipeRow>
              </div>
            );
          })}
        </div>
        {toast ? (
          <div className="undo-toast" role="status">
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => {
                window.clearTimeout(timer.current);
                undoRef.current?.();
                setToast("");
              }}
            >
              {t("mine.undo")}
            </button>
          </div>
        ) : null}
      </main>
    </AuthGate>
  );
}
