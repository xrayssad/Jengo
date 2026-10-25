"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-5 py-4 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Mipangilio</h1>
        </div>
      </header>
      <form onSubmit={save} className="max-w-md mx-auto px-5 pt-6">
        <div className="soft-card p-5 space-y-4">
          <label className="block text-sm font-semibold" style={{ color: "#2E1A0F" }}>Jina linaloonekana</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Jina lako" className="input-chocolate w-full px-4 py-3.5 text-sm" />
          <button type="submit" className="btn-primary w-full py-3.5 rounded-full font-semibold text-sm">Hifadhi</button>
          {saved && <p className="text-sm text-center" style={{ color: "#5E7F4F" }}>Imehifadhiwa kwenye simu hii.</p>}
          <p className="text-xs" style={{ color: "#5C4033" }}>Kubadili nenosiri kutasubiri akaunti halisi. Kwa sasa login ni ya majaribio.</p>
        </div>
      </form>
    </main>
  );
}
