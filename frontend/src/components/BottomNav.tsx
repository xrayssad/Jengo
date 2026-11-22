"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Home, Clapperboard, Plus, MessageCircle, User } from "lucide-react";
import { useT } from "@/lib/i18n";
import { haptic, motionDur, motionEase, tapSpring, usePrefersReducedMotion } from "@/lib/motion";
import { useInboxLive } from "./MqttInbox";

const STACK_KEY = "jengo_tab_stack";

function tabFor(path: string) {
  if (path.startsWith("/reels")) return "/reels";
  if (path === "/messages" || path.startsWith("/messages/") || path.startsWith("/chat")) return "/messages";
  if (path === "/profile" || path.startsWith("/settings") || path.startsWith("/hakiki")) return "/profile";
  return "/home";
}

function readStack(): Record<string, string> {
  try {
    const data = JSON.parse(sessionStorage.getItem(STACK_KEY) || "{}") as Record<string, string>;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeStack(tab: string, full: string) {
  const data = readStack();
  data[tab] = full;
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

const items = [
  { href: "/home", label: "nav.home", icon: Home },
  { href: "/reels", label: "nav.reels", icon: Clapperboard },
  { href: "/messages", label: "nav.chat", icon: MessageCircle },
  { href: "/profile", label: "nav.profile", icon: User },
];

export default function BottomNav({ hidden = false }: { hidden?: boolean }) {
  const path = usePathname() || "/";
  const router = useRouter();
  const t = useT();
  const reduce = usePrefersReducedMotion();
  const inbox = useInboxLive();
  const chatUnread = inbox.unread && path !== "/messages";
  const currentTab = tabFor(path);

  useEffect(() => {
    if (hidden) return;
    if (path.startsWith("/login") || path.startsWith("/register")) return;
    writeStack(currentTab, `${path}${window.location.search}`);
  }, [currentTab, hidden, path]);

  const link = (item: (typeof items)[number]) => {
    const Icon = item.icon;
    const active = currentTab === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={active ? "nav-item is-active" : "nav-item"}
        aria-current={active ? "page" : undefined}
        onClick={(event) => {
          haptic("light");
          if (active) {
            event.preventDefault();
            if (path !== item.href) {
              router.push(item.href);
              return;
            }
            if (window.scrollY > 16) {
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
              return;
            }
            window.dispatchEvent(new Event("jengo-tab-refresh"));
            return;
          }
          const saved = readStack()[item.href];
          const savedPath = saved?.split("?")[0] || "";
          if (saved && savedPath && savedPath !== item.href) {
            event.preventDefault();
            router.push(saved);
          }
        }}
      >
        {active ? (
          reduce ? (
            <span className="nav-pill" />
          ) : (
            <motion.span layoutId="nav-pill" className="nav-pill" transition={tapSpring} />
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
        {active ? (
          reduce ? (
            <span className="nav-label">{t(item.label)}</span>
          ) : (
            <motion.span
              className="nav-label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: motionDur.fast, ease: motionEase }}
            >
              {t(item.label)}
            </motion.span>
          )
        ) : null}
      </Link>
    );
  };

  return (
    <nav className={hidden ? "bottom-nav is-hidden" : "bottom-nav"} aria-hidden={hidden || undefined}>
      <div
        className="nav-island nav-row mx-auto"
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
