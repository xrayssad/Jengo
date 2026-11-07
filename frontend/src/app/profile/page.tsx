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
import { ProfileSkeleton } from "@/components/Skeletons";

const menuItems = [
  { icon: FileText, label: "My requests", desc: "Requests you sent", href: "/maombi-yangu" },
  { icon: Home, label: "My Posts", desc: "Rooms, Airbnb, shops, frames, materials and reels", href: "/mypost" },
  { icon: Heart, label: "Favorites", desc: "Listings you saved", href: "/favorites" },
  { icon: Settings, label: "Settings", desc: "Account and privacy", href: "/settings" },
];

export default function ProfilePage() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setName(user.username || user.full_name || user.email || "User");
      setEmail(user.email || "");
    }
    setReady(true);
  }, []);

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Account</p>
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Profile</h1>
          </div>
        </div>
      </header>

      {!ready ? (
        <ProfileSkeleton />
      ) : (
      <div className="max-w-md mx-auto px-5 py-5 space-y-5">
        <div className="estate-card relative overflow-hidden" style={{ height: 168 }}>
          <Image src="/real/apartment.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(var(--veil-rgb),0.55), rgba(var(--veil-rgb),0.12))" }} />
          <div className="photo-dock">
            <p className="text-2xl font-bold leading-none" style={{ color: "var(--ink)" }}>{name}</p>
            <p className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: "var(--muted)" }}>
              <Mail size={12} color="var(--mocha)" />
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

        <div className="sheet overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-4"
                style={{
                  borderBottom: i < menuItems.length - 1 ? "1px solid rgba(var(--caramel-rgb),0.22)" : "none",
                }}
              >
                <div className="soft-icon-btn shrink-0">
                  <Icon size={18} color="var(--mocha)" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color="var(--mocha)" />
              </Link>
            );
          })}
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm sheet"
          style={{ color: "var(--error)" }}
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>
      )}
    </main>
    </AuthGate>
  );
}
