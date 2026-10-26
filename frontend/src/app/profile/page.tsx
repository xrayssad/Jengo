"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft, Mail, FileText, Heart, Settings, LogOut,
  ChevronRight, Home, Plus
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { clearAuth, getAuthUser } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import AdminLink from "@/components/AdminLink";

const menuItems = [
  { icon: FileText, label: "My requests", desc: "Requests you sent", href: "/maombi-yangu" },
  { icon: Home, label: "My listings", desc: "Listings you posted", href: "/matangazo-yangu" },
  { icon: Heart, label: "Favorites", desc: "Listings you saved", href: "/favorites" },
  { icon: Settings, label: "Settings", desc: "Account and privacy", href: "/settings" },
];

export default function ProfilePage() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setName(user.username || user.full_name || user.email || "User");
      setEmail(user.email || "");
    }
  }, []);

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} strokeWidth={2.2} color="#2E1A0F" />
          </Link>
          <h1 className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Profile</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        <div className="relative overflow-hidden rounded-[28px]" style={{ height: 168 }}>
          <Image src="/real/apartment.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(46,26,15,0.55), rgba(46,26,15,0.12))" }} />
          <div className="photo-dock">
            <p className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>{name}</p>
            <p className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: "#5C4033" }}>
              <Mail size={12} color="#8B5E3C" />
              {email || "Account"}
            </p>
          </div>
        </div>

        <Link
          href="/weka-tangazo"
          className="btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Post a new listing
        </Link>
        <div className="text-center">
          <AdminLink />
        </div>

        <div className="sheet rounded-[28px] overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-4"
                style={{
                  borderBottom: i < menuItems.length - 1 ? "1px solid rgba(210,166,121,0.28)" : "none",
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 icon-glass">
                  <Icon size={18} color="#8B5E3C" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "#2E1A0F" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "#5C4033" }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color="#8B5E3C" />
              </Link>
            );
          })}
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm"
          style={{
            backgroundColor: "rgba(255,246,237,0.8)",
            color: "#A6452E",
            border: "1px solid rgba(166,69,46,0.35)",
          }}
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>
    </main>
    </AuthGate>
  );
}
