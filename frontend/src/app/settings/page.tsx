"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

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
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5" style={{ backgroundColor: "rgba(255,246,237,0.94)", borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}>
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Mipangilio</h1>
        </div>
      </header>
      <form onSubmit={save} className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <label className="block text-sm font-semibold" style={{ color: "#2E1A0F" }}>Jina linaloonekana</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Jina lako" className="w-full px-4 py-3.5 text-sm rounded-[16px]" style={{ border: "1.5px solid #3D2415", backgroundColor: "white", color: "#2E1A0F" }} />
        <button type="submit" className="w-full py-3.5 rounded-[16px] font-semibold text-sm" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}>Hifadhi</button>
        {saved && <p className="text-sm text-center" style={{ color: "#5E7F4F" }}>Imehifadhiwa kwenye simu hii.</p>}
        <p className="text-xs" style={{ color: "#5C4033" }}>Kubadili nenosiri kutasubiri akaunti halisi. Kwa sasa login ni ya majaribio.</p>
      </form>
      <BottomNav />
    </main>
  );
}
