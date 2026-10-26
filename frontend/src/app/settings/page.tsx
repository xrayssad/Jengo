"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const KEY = "jengo_profile_name";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem(KEY) || "");
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(KEY, name.trim());
    setSaved(true);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Settings</h1>
        </div>
      </header>
      <div className="max-w-md mx-auto px-5 pt-6 space-y-4">
        <div className="sheet rounded-[28px] p-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--mocha)" }}>Look</p>
          <ThemeToggle />
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
            Night mode keeps the cocoa palette, just after dark.
          </p>
        </div>
        <form onSubmit={save} className="sheet rounded-[28px] p-5 space-y-4">
          <label className="block text-sm font-semibold" style={{ color: "var(--ink)" }}>Display name</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" className="input-chocolate w-full px-4 py-3.5 text-sm" />
          <button type="submit" className="btn-primary w-full py-3.5 rounded-full font-semibold text-sm">Save</button>
          {saved && <p className="text-sm text-center" style={{ color: "var(--success)" }}>Saved on this phone.</p>}
          <p className="text-xs" style={{ color: "var(--muted)" }}>Password changes wait for a real account. Login is live now.</p>
        </form>
      </div>
    </main>
  );
}
