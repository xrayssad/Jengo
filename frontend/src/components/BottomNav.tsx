"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";
import { useInboxLive } from "./MqttInbox";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Browse", icon: Compass },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  const inbox = useInboxLive();
  const chatUnread = inbox.unread && path !== "/messages";

  const link = (item: (typeof items)[number]) => {
    const Icon = item.icon;
    const active = path === item.href;
    return (
      <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 h-full min-w-0">
        <span className="relative">
          <Icon size={20} color={active ? "var(--ink)" : "var(--mocha)"} strokeWidth={active ? 2.2 : 1.7} />
          {item.href === "/messages" && chatUnread && (
            <span
              className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--error)", boxShadow: "0 0 0 2px rgba(var(--surface-rgb),0.95)" }}
            />
          )}
        </span>
        <span className="text-[10px] leading-none" style={{ color: active ? "var(--ink)" : "var(--mocha)" }}>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 px-3"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="nav-island mx-auto h-[62px] px-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          alignItems: "center",
        }}
      >
        {link(items[0])}
        {link(items[1])}
        <div className="flex items-center justify-center min-w-0">
          <Link
            href="/weka-tangazo"
            aria-label="Post a listing"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--ink)", boxShadow: "0 8px 18px rgba(var(--veil-rgb),0.28)" }}
          >
            <Plus size={20} color="var(--paper)" strokeWidth={2.4} />
          </Link>
        </div>
        {link(items[2])}
        {link(items[3])}
      </div>
    </nav>
  );
}
