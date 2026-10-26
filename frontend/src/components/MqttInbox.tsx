"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchMqttSession, getAuthUser } from "@/lib/api";

type Ping = { thread_key?: string; id?: string };
type Ctx = { unread: boolean; clear: () => void };

const InboxCtx = createContext<Ctx>({ unread: false, clear: () => {} });

export function useInboxLive() {
  return useContext(InboxCtx);
}

export default function MqttInbox({ children }: { children: React.ReactNode }) {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    let client: { end: (force?: boolean) => void } | null = null;
    let stop = false;
    let wait: number | undefined;

    const start = async () => {
      if (stop || client) return;
      if (!getAuthUser()) {
        wait = window.setTimeout(start, 1500);
        return;
      }
      try {
        const mqtt = (await import("mqtt")).default;
        if (stop) return;
        const session = await fetchMqttSession();
        if (stop) return;
        const next = mqtt.connect(session.url, {
          clientId: session.client_id,
          clean: true,
          reconnectPeriod: 4000,
          protocolVersion: 4,
        });
        client = next;
        next.on("connect", () => {
          window.__jengoMqtt = true;
          next.subscribe(session.topic);
        });
        next.on("close", () => {
          window.__jengoMqtt = false;
        });
        next.on("message", (_topic, buf) => {
          let ping: Ping = {};
          try {
            ping = JSON.parse(buf.toString()) as Ping;
          } catch {
            return;
          }
          window.dispatchEvent(new CustomEvent("jengo-chat", { detail: ping }));
          setUnread(true);
        });
      } catch {
        window.__jengoMqtt = false;
      }
    };

    start();
    return () => {
      stop = true;
      if (wait) window.clearTimeout(wait);
      window.__jengoMqtt = false;
      client?.end(true);
    };
  }, []);

  return <InboxCtx.Provider value={{ unread, clear: () => setUnread(false) }}>{children}</InboxCtx.Provider>;
}

declare global {
  interface Window {
    __jengoMqtt?: boolean;
  }
}
