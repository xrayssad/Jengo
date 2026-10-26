"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Tazama", icon: Compass },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profili", icon: User },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 px-3"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div className="nav-island flex items-center h-[62px] w-full max-w-md mx-auto px-1">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 h-full">
              <Icon size={20} color={active ? "#2E1A0F" : "#8B5E3C"} strokeWidth={active ? 2.2 : 1.7} />
              <span className="text-[10px] leading-none" style={{ color: active ? "#2E1A0F" : "#8B5E3C" }}>{item.label}</span>
            </Link>
          );
        })}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <Link
            href="/weka-tangazo"
            aria-label="Weka tangazo"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#2E1A0F", boxShadow: "0 8px 18px rgba(46,26,15,0.28)" }}
          >
            <Plus size={20} color="#FFF6ED" strokeWidth={2.4} />
          </Link>
        </div>
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 h-full">
              <Icon size={20} color={active ? "#2E1A0F" : "#8B5E3C"} strokeWidth={active ? 2.2 : 1.7} />
              <span className="text-[10px] leading-none" style={{ color: active ? "#2E1A0F" : "#8B5E3C" }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
