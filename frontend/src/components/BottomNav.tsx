"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: "rgba(255,246,237,0.96)",
        borderTop: "1px solid rgba(210,166,121,0.4)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-end h-[64px] px-2">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 h-full">
              <Icon size={22} color={active ? "#2E1A0F" : "#8B5E3C"} strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[10px]" style={{ color: active ? "#2E1A0F" : "#8B5E3C" }}>{item.label}</span>
            </Link>
          );
        })}

        <div className="flex items-center justify-center">
          <Link
            href="/weka-tangazo"
            aria-label="Weka tangazo"
            className="w-12 h-12 rounded-full flex items-center justify-center -mt-5"
            style={{ backgroundColor: "#2E1A0F", boxShadow: "0 6px 18px rgba(46,26,15,0.35)" }}
          >
            <Plus size={26} color="#FFF6ED" strokeWidth={2.5} />
          </Link>
        </div>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 h-full">
              <Icon size={22} color={active ? "#2E1A0F" : "#8B5E3C"} strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[10px]" style={{ color: active ? "#2E1A0F" : "#8B5E3C" }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
