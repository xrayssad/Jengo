"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { fetchInbox, type ChatMessage } from "@/lib/api";

export default function MessagesPage() {
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInbox()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Ujumbe haujafunguka"));
  }, []);

  return (
    <AuthGate>
      <main className="min-h-screen pb-8" style={{ backgroundColor: "#FFF6ED" }}>
        <header className="px-5 pt-6 max-w-md mx-auto">
          <h1 className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Ujumbe</h1>
          <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Ujumbe wa moja kwa moja na mazungumzo ya maombi</p>
        </header>
        <div className="max-w-md mx-auto px-5 pt-5 space-y-3">
          {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
          {items.length === 0 && !error && (
            <div className="text-center py-16">
              <Send size={28} color="#D2A679" className="mx-auto mb-3" />
              <p className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Hakuna ujumbe</p>
              <p className="text-sm mt-1" style={{ color: "#5C4033" }}>Fungua tangazo, kisha tuma ujumbe wa moja kwa moja.</p>
            </div>
          )}
          {items.map((c) => (
            <Link key={c.thread_key || c.id} href={c.href || "/messages"} className="soft-card block p-4 card-lift">
              <p className="text-xs font-semibold" style={{ color: "#8B5E3C" }}>
                {c.kind === "booking" ? "Ombi" : "Ujumbe wa moja kwa moja"}
              </p>
              <h2 className="font-heading mt-1" style={{ color: "#2E1A0F" }}>{c.title || "Ujumbe"}</h2>
              <p className="text-sm truncate mt-1" style={{ color: "#5C4033" }}>{c.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </AuthGate>
  );
}
