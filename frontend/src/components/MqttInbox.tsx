"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { fetchInbox, fetchMqttSession, getAuthUser } from "@/lib/api";

type Ping = { type?: string; thread_key?: string; id?: string; listing_id?: string; likes_count?: number };
type Unwatch = () => void;
type Ctx = { unread: boolean; clear: () => void; watchListing: (id: string) => Unwatch };

const UNREAD_KEY = "jengo_inbox_unread";
const SEEN_KEY = "jengo_inbox_seen";
const InboxCtx = createContext<Ctx>({ unread: false, clear: () => {}, watchListing: () => () => {} });

type MqttClient = {
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  end: (force?: boolean) => void;
  on: (ev: string, fn: (...args: unknown[]) => void) => void;
};

export function useInboxLive() {
  return useContext(InboxCtx);
}

function persistUnread(on: boolean) {
  try {
    localStorage.setItem(UNREAD_KEY, on ? "1" : "0");
    if (!on) localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    /* quota */
  }
}

function viewingInbox(path: string) {
  return path === "/messages";
}

export function InboxLink({ className }: { className?: string }) {
  const inbox = useInboxLive();
  return (
    <Link href="/messages" className={className} aria-label="Messages">
      <span className="relative inline-flex">
        <Send size={16} color="#2E1A0F" />
        {inbox.unread && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#A6452E", boxShadow: "0 0 0 2px rgba(255,246,237,0.95)" }}
          />
        )}
      </span>
    </Link>
  );
}

export default function MqttInbox({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const pathRef = useRef(path);
  pathRef.current = path;
  const [unread, setUnread] = useState(false);
  const clientRef = useRef<MqttClient | null>(null);
  const prefixRef = useRef("");
  const watched = useRef(new Map<string, number>());

  const markUnread = useCallback(() => {
    setUnread(true);
    persistUnread(true);
  }, []);

  const clear = useCallback(() => {
    setUnread(false);
    persistUnread(false);
  }, []);

  const subscribeListing = (id: string) => {
    const topic = prefixRef.current && id ? `${prefixRef.current}${id}` : "";
    if (topic) clientRef.current?.subscribe(topic);
  };

  const watchListing = useCallback((id: string) => {
    if (!id) return () => {};
    const n = (watched.current.get(id) || 0) + 1;
    watched.current.set(id, n);
    if (n === 1) subscribeListing(id);
    return () => {
      const left = (watched.current.get(id) || 1) - 1;
      if (left <= 0) {
        watched.current.delete(id);
        const topic = prefixRef.current ? `${prefixRef.current}${id}` : "";
        if (topic) clientRef.current?.unsubscribe(topic);
      } else {
        watched.current.set(id, left);
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) localStorage.setItem(SEEN_KEY, new Date().toISOString());
      if (localStorage.getItem(UNREAD_KEY) === "1") setUnread(true);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (viewingInbox(path)) clear();
  }, [path, clear]);

  useEffect(() => {
    let stop = false;
    let wait: number | undefined;
    let poll: number | undefined;

    const onPing = (ping: Ping) => {
      if (ping.type === "like") {
        window.dispatchEvent(new CustomEvent("jengo-like", { detail: ping }));
        return;
      }
      window.dispatchEvent(new CustomEvent("jengo-chat", { detail: ping }));
      if (!viewingInbox(pathRef.current)) markUnread();
    };

    const checkInbox = async () => {
      if (!getAuthUser()) return;
      try {
        const res = await fetchInbox();
        const seen = localStorage.getItem(SEEN_KEY) || "";
        const hasNew = (res.items || []).some((m) => (m.created_at || "") > seen);
        if (hasNew && !viewingInbox(pathRef.current)) markUnread();
      } catch {
        /* offline */
      }
    };

    const start = async () => {
      if (stop || clientRef.current) return;
      await checkInbox();
      try {
        const mqtt = (await import("mqtt")).default;
        if (stop) return;
        const session = await fetchMqttSession();
        if (stop) return;
        prefixRef.current = session.listing_prefix || "";
        const next = mqtt.connect(session.url, {
          clientId: session.client_id,
          clean: true,
          reconnectPeriod: 2500,
          protocolVersion: 4,
        }) as unknown as MqttClient;
        clientRef.current = next;
        next.on("connect", () => {
          window.__jengoMqtt = true;
          if (session.topic) next.subscribe(session.topic);
          for (const id of watched.current.keys()) subscribeListing(id);
        });
        next.on("close", () => {
          window.__jengoMqtt = false;
        });
        next.on("message", (...args: unknown[]) => {
          const buf = args[1] as { toString?: () => string } | undefined;
          let ping: Ping = {};
          try {
            ping = JSON.parse(buf?.toString?.() || "") as Ping;
          } catch {
            return;
          }
          onPing(ping);
        });
      } catch {
        window.__jengoMqtt = false;
        if (!stop && getAuthUser()) wait = window.setTimeout(start, 2500);
      }
    };

    start();
    poll = window.setInterval(() => {
      if (!window.__jengoMqtt) checkInbox();
    }, 12000);
    const onFocus = () => {
      if (!window.__jengoMqtt) checkInbox();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      stop = true;
      if (wait) window.clearTimeout(wait);
      if (poll) window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.__jengoMqtt = false;
      clientRef.current?.end(true);
      clientRef.current = null;
    };
  }, [markUnread]);

  return <InboxCtx.Provider value={{ unread, clear, watchListing }}>{children}</InboxCtx.Provider>;
}

declare global {
  interface Window {
    __jengoMqtt?: boolean;
  }
}
