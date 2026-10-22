"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const chatMeta: Record<string, { name: string; listing: string }> = {
  "1": { name: "Juma Hassan", listing: "Chumba Kinondoni" },
  "2": { name: "Asha Mohamed", listing: "Apartment Masaki" },
  "3": { name: "Peter Kimaro", listing: "Godown Mikocheni" },
  "4": { name: "BuildMart TZ", listing: "Vifaa Kariakoo" },
};

const initialMessages: Record<string, { from: "me" | "them"; text: string; time: string }[]> = {
  "1": [
    { from: "them", text: "Habari, naona umeomba chumba cha Kinondoni.", time: "10:10" },
    { from: "me", text: "Ndiyo, bado kinapatikana?", time: "10:15" },
    { from: "them", text: "Chumba bado kinapatikana. Unaweza kuja kuona leo jioni.", time: "10:24" },
  ],
  "2": [
    { from: "me", text: "Apartment iko free lini?", time: "Jana 14:00" },
    { from: "them", text: "Naweza kuja kuona kesho asubuhi", time: "Jana 15:30" },
  ],
  "3": [
    { from: "them", text: "Bei ya godown ni TZS 450,000/mwezi", time: "Jana" },
  ],
  "4": [
    { from: "them", text: "Saruji iko ready kwa kuchukua", time: "Wiki iliyopita" },
  ],
};

export default function ChatPage() {
  const [id, setId] = useState("1");
  const [messages, setMessages] = useState<{ from: "me" | "them"; text: string; time: string }[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const chatId = parts[parts.length - 1] || "1";
    setId(chatId);
    setMessages(initialMessages[chatId] || initialMessages["1"]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const meta = chatMeta[id] || chatMeta["1"];

  const send = () => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((m) => [...m, { from: "me", text: text.trim(), time }]);
    setText("");
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/messages" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate" style={{ color: "#2E1A0F" }}>{meta.name}</h1>
            <p className="text-[11px] truncate" style={{ color: "#8B5E3C" }}>{meta.listing}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-3.5 py-2.5 rounded-[16px]"
              style={{
                backgroundColor: m.from === "me" ? "#2E1A0F" : "white",
                color: m.from === "me" ? "#FFF6ED" : "#2E1A0F",
                border: m.from === "me" ? "none" : "1px solid rgba(61,36,21,0.12)",
                borderBottomRightRadius: m.from === "me" ? 4 : 16,
                borderBottomLeftRadius: m.from === "them" ? 4 : 16,
              }}
            >
              <p className="text-sm leading-relaxed">{m.text}</p>
              <p className="text-[10px] mt-1 text-right opacity-60">{m.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 px-4 py-3 glass" style={{ borderTop: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Andika ujumbe..."
            className="input-chocolate flex-1 py-3 px-4 text-sm"
          />
          <button
            onClick={send}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(145deg, #8B5E3C, #2E1A0F)" }}
          >
            <Send size={18} color="#FFF6ED" />
          </button>
        </div>
      </div>
    </main>
  );
}
