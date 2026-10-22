"use client";

import { useState } from "react";
import { ArrowLeft, User, Lock, Bell, Globe, Shield, Save } from "lucide-react";
import Link from "next/link";
import AppAlert, { AlertKind } from "@/components/AppAlert";

export default function SettingsPage() {
  const [username, setUsername] = useState("jengo_user");
  const [phone, setPhone] = useState("0712 345 678");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saved, setSaved] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const showAlert = (kind: AlertKind, title: string, message?: string) => {
    setAlertKind(kind); setAlertTitle(title); setAlertMsg(message || ""); setAlertOpen(true);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showAlert("error", "Nenosiri hazifanani", "Hakikisha nenosiri jipya na uthibitisho ni sawa.");
      return;
    }
    if (!newPass || newPass.length < 4) {
      showAlert("warning", "Nenosiri fupi", "Tumia angalau herufi 4.");
      return;
    }
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    showAlert("success", "Imefanikiwa", "Nenosiri limebadilishwa (majaribio — backend baadaye).");
  };

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Mipangilio</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Settings</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Profile info */}
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} color="#8B5E3C" />
            <h2 className="text-sm font-bold" style={{ color: "#2E1A0F" }}>Akaunti</h2>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#5C4033" }}>Jina la mtumiaji</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-chocolate w-full px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#5C4033" }}>Namba ya simu</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-chocolate w-full px-4 py-3 text-sm" />
          </div>
          <button type="submit" className="btn-primary w-full py-3 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2">
            <Save size={16} /> Hifadhi mabadiliko
          </button>
          {saved && <p className="text-xs text-center font-medium" style={{ color: "#5E7F4F" }}>Imehifadhiwa (majaribio)</p>}
        </form>

        {/* Password */}
        <form onSubmit={changePassword} className="space-y-3 pt-2" style={{ borderTop: "1px solid rgba(61,36,21,0.12)" }}>
          <div className="flex items-center gap-2 mb-1 pt-4">
            <Lock size={16} color="#8B5E3C" />
            <h2 className="text-sm font-bold" style={{ color: "#2E1A0F" }}>Badilisha nenosiri</h2>
          </div>
          <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Nenosiri la sasa" className="input-chocolate w-full px-4 py-3 text-sm" />
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Nenosiri jipya" className="input-chocolate w-full px-4 py-3 text-sm" />
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Thibitisha nenosiri jipya" className="input-chocolate w-full px-4 py-3 text-sm" />
          <button type="submit" className="w-full py-3 rounded-[14px] font-semibold text-sm" style={{ backgroundColor: "white", color: "#2E1A0F", border: "1.5px solid #3D2415" }}>
            Badilisha nenosiri
          </button>
        </form>

        {/* Other */}
        <div className="space-y-2 pt-2" style={{ borderTop: "1px solid rgba(61,36,21,0.12)" }}>
          <p className="text-sm font-bold pt-4 mb-2" style={{ color: "#2E1A0F" }}>Nyingine</p>
          {[
            { icon: Bell, label: "Arifa (Notifications)", href: "#" },
            { icon: Globe, label: "Lugha — Kiswahili", href: "#" },
            { icon: Shield, label: "Faragha na data", href: "#" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 p-3.5 rounded-[14px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
                <Icon size={18} color="#8B5E3C" />
                <span className="text-sm font-medium" style={{ color: "#2E1A0F" }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
  );
}
