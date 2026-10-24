"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { readChat, sendChat, type ChatMsg } from "@/lib/chat";

export default function ChatClient({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [items, setItems] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setItems(readChat(id));
  }, [id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setItems(sendChat(id, t, title));
    setText("");
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
          <ArrowLeft size={18} color="#2E1A0F" />
        </button>
        <h1 className="font-bold truncate" style={{ color: "#2E1A0F" }}>{title}</h1>
      </header>
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-center py-10" style={{ color: "#5C4033" }}>Anza mazungumzo kuhusu tangazo hili.</p>}
        {items.map((m) => (
          <div key={m.id} className="flex" style={{ justifyContent: m.mine ? "flex-end" : "flex-start" }}>
            <div className="max-w-[80%] px-3.5 py-2.5 rounded-[16px] text-sm" style={{ backgroundColor: m.mine ? "#2E1A0F" : "white", color: m.mine ? "#FFF6ED" : "#2E1A0F", border: m.mine ? "none" : "1px solid rgba(61,36,21,0.12)" }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="sticky bottom-0 px-4 py-3 flex gap-2 max-w-md w-full mx-auto" style={{ backgroundColor: "#FFF6ED", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Andika ujumbe..." className="flex-1 rounded-[16px] px-4 py-3 text-sm outline-none" style={{ border: "1.5px solid #3D2415", backgroundColor: "white", color: "#2E1A0F" }} />
        <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2E1A0F" }}>
          <Send size={18} color="#FFF6ED" />
        </button>
      </form>
    </main>
  );
}
