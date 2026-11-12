"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Clapperboard, Plus, MessageCircle, User } from "lucide-react";
import { useT } from "@/lib/i18n";
import { moveSpring, usePrefersReducedMotion } from "@/lib/motion";
import { useInboxLive } from "./MqttInbox";

const items = [
  { href: "/home", label: "nav.home", icon: Home },
  { href: "/reels", label: "nav.reels", icon: Clapperboard },
  { href: "/messages", label: "nav.chat", icon: MessageCircle },
  { href: "/profile", label: "nav.profile", icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  const t = useT();
  const reduce = usePrefersReducedMotion();
  const inbox = useInboxLive();
  const chatUnread = inbox.unread && path !== "/messages";

  const link = (item: (typeof items)[number]) => {
    const Icon = item.icon;
    const active = item.href === "/reels" ? path.startsWith("/reels") : path === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={active ? "nav-item is-active" : "nav-item"}
        aria-current={active ? "page" : undefined}
      >
        {active ? (
          reduce ? (
            <span className="nav-pill" />
          ) : (
            <motion.span layoutId="nav-pill" className="nav-pill" transition={moveSpring} />
          )
        ) : null}
        <span className="nav-ico relative inline-flex">
          <Icon size={20} color="currentColor" strokeWidth={active ? 2.2 : 1.75} />
          {item.href === "/messages" && chatUnread && (
            <span
              className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--accent)", boxShadow: "0 0 0 2px var(--nav)" }}
            />
          )}
        </span>
        <span className="nav-label">{t(item.label)}</span>
      </Link>
    );
  };

  return (
    <nav className="bottom-nav">
      <div
        className="nav-island mx-auto px-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
          alignItems: "center",
        }}
      >
        {link(items[0])}
        {link(items[1])}
        <div className="flex items-center justify-center min-w-0">
          <Link href="/weka-tangazo" aria-label={t("nav.post")} className="nav-add">
            <Plus size={22} color="currentColor" strokeWidth={2.4} />
          </Link>
        </div>
        {link(items[2])}
        {link(items[3])}
      </div>
    </nav>
  );
}
