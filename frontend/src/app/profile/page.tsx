"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft, Mail, FileText, Heart, Settings, LogOut,
  ChevronRight, BadgeCheck, Home, Plus
} from "lucide-react";
import Link from "next/link";
import { clearAuth, getAuthUser } from "@/lib/api";
import AuthGate from "@/components/AuthGate";

const menuItems = [
  { icon: FileText, label: "Maombi yangu", desc: "Maombi uliyotuma", href: "/maombi-yangu" },
  { icon: Home, label: "Matangazo yangu", desc: "Uliyoweka", href: "/matangazo-yangu" },
  { icon: Heart, label: "Vipendwa", desc: "Matangazo uliyohifadhi", href: "/favorites" },
  { icon: Settings, label: "Mipangilio", desc: "Akaunti na faragha", href: "/settings" },
];

export default function ProfilePage() {
  const [name, setName] = useState("Mtumiaji");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setName(user.username || user.full_name || user.email || "Mtumiaji");
      setEmail(user.email || "");
    }
  }, []);

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Profile</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        <div
          className="rounded-[22px] p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(165deg, #3D2415 0%, #2E1A0F 60%, #1A0F08 100%)",
            border: "1px solid rgba(210,166,121,0.3)",
            boxShadow: "0 8px 28px rgba(46,26,15,0.35)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl"
            style={{ background: "radial-gradient(circle, #8B5E3C, transparent)" }} />

          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: "linear-gradient(145deg, #8B5E3C, #D2A679)",
                color: "#2E1A0F",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate" style={{ color: "#FFF6ED" }}>{name}</h2>
                <BadgeCheck size={16} color="#C4A35A" className="opacity-40" />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail size={12} color="#D2A679" />
                <span className="text-sm truncate" style={{ color: "#D2A679" }}>
                  {email || "Akaunti ya majaribio"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/weka-tangazo"
          className="btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-[18px] font-semibold text-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Weka Tangazo Jipya
        </Link>

        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            backgroundColor: "white",
            border: "1.5px solid #3D2415",
            boxShadow: "0 0 0 1px rgba(46,26,15,0.1), 0 4px 16px rgba(46,26,15,0.08)",
          }}
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-4 transition-colors"
                style={{
                  borderBottom: i < menuItems.length - 1 ? "1px solid rgba(61,36,21,0.12)" : "none",
                }}
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#FFF6ED" }}
                >
                  <Icon size={18} color="#8B5E3C" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "#2E1A0F" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "#5C4033" }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color="#8B5E3C" />
              </Link>
            );
          })}
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-semibold text-sm"
          style={{
            backgroundColor: "white",
            color: "#A6452E",
            border: "1.5px solid rgba(166,69,46,0.4)",
          }}
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} strokeWidth={2} />
          Tokaa
        </button>
      </div>
    </main>
    </AuthGate>
  );
}
