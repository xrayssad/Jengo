"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Bell, ChevronRight, CircleHelp, Globe, LogOut, Moon, Smartphone, User, Vibrate } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LangDrawer } from "@/components/HeaderTools";
import { InstallMenuItem, useInstallPrompt } from "@/components/InstallUI";
import { clearAuth } from "@/lib/api";
import { readScoped, writeScoped } from "@/lib/userScope";
import { useT } from "@/lib/i18n";
import { haptic, hapticPref, setHapticPref } from "@/lib/motion";
import BottomSheet from "@/components/BottomSheet";
import { markNotifyPermit, notifyPermitSeen } from "@/lib/permit";

const KEY = "jengo_profile_name";

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const { canInstall } = useInstallPrompt();
  const [askNote, setAskNote] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [account, setAccount] = useState(false);

  useEffect(() => {
    setName(readScoped("profile_name") || "");
    setHaptics(hapticPref());
  }, []);

  const openNotes = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default" && !notifyPermitSeen()) {
      setAskNote(true);
      return;
    }
    router.push("/messages");
  };

  const allowNotes = async () => {
    markNotifyPermit();
    setAskNote(false);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    } catch {
      /* the browser blocked the prompt */
    }
    router.push("/messages");
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    writeScoped("profile_name", name.trim());
    setSaved(true);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label={t("back")}>
            <ArrowLeft size={18} color="var(--ink)" />
          </Link>
          <h1 className="page-title">{t("profile.tab.settings")}</h1>
        </div>
      </header>
      <div className="canvas-read px-5 pt-6 space-y-4">
        <div className="list-group">
          <button type="button" className="list-row" aria-expanded={account} onClick={() => setAccount((on) => !on)}>
            <span className="list-ico"><User size={16} /></span>
            <span><strong>{t("settings.account")}</strong><small>{t("settings.accountNote")}</small></span>
            <ChevronRight size={16} />
          </button>
          {account ? (
            <form onSubmit={save} className="list-form">
              <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder={t("settings.name")} className="input-chocolate w-full px-4 py-3.5 text-sm" />
              <button type="submit" className="btn-primary w-full py-3.5 rounded-full font-semibold text-sm">{t("settings.save")}</button>
              {saved ? <p className="text-sm text-center" style={{ color: "var(--success)" }}>{t("settings.saved")}</p> : null}
            </form>
          ) : null}
          <Link href="/hakiki" className="list-row">
            <span className="list-ico"><BadgeCheck size={16} /></span>
            <span><strong>{t("verify.menu")}</strong></span>
            <ChevronRight size={16} />
          </Link>
          <button type="button" className="list-row" onClick={openNotes}>
            <span className="list-ico"><Bell size={16} /></span>
            <span><strong>{t("notes")}</strong></span>
            <ChevronRight size={16} />
          </button>
          <div className="list-row">
            <span className="list-ico"><Globe size={16} /></span>
            <LangDrawer />
          </div>
          <div className="list-row">
            <span className="list-ico"><Moon size={16} /></span>
            <span><strong>{t("theme.dark")}</strong><small>{t("settings.themeNote")}</small></span>
            <ThemeToggle switchOnly />
          </div>
          <button
            type="button"
            className="list-row"
            aria-pressed={haptics}
            onClick={() => {
              const next = !haptics;
              setHaptics(next);
              setHapticPref(next);
              if (next) haptic("success");
            }}
          >
            <span className="list-ico"><Vibrate size={16} /></span>
            <span><strong>{t("haptics")}</strong><small>{t("haptics.note")}</small></span>
            <i className="list-switch">{haptics ? t("haptics.on") : t("haptics.off")}</i>
          </button>
          {canInstall ? (
            <div className="list-row">
              <span className="list-ico"><Smartphone size={16} /></span>
              <InstallMenuItem />
            </div>
          ) : null}
          <Link href="/about" className="list-row">
            <span className="list-ico"><CircleHelp size={16} /></span>
            <span><strong>{t("settings.help")}</strong></span>
            <ChevronRight size={16} />
          </Link>
        </div>
        <button
          type="button"
          className="list-row list-out"
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <span className="list-ico"><LogOut size={16} /></span>
          <span><strong>{t("settings.logout")}</strong></span>
        </button>
      </div>
      <BottomSheet
        open={askNote}
        title={t("permit.notify.title")}
        onClose={() => {
          markNotifyPermit();
          setAskNote(false);
        }}
      >
        <p className="sheet-copy">{t("permit.notify.body")}</p>
        <button type="button" className="btn-primary sheet-submit" onClick={() => void allowNotes()}>{t("permit.allow")}</button>
      </BottomSheet>
    </main>
  );
}
