"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Mail, FileText, Heart, Settings, LogOut,
  ChevronRight, Home, Plus, BadgeCheck, Receipt, Inbox, Download, CreditCard, Hammer,
} from "lucide-react";
import Link from "next/link";
import { clearAuth, fetchMyPosts, fetchTopSellers, getAuthUser, type Listing } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import AdminLink from "@/components/AdminLink";
import ReportImpersonation from "@/components/ReportImpersonation";
import VerifiedBadge from "@/components/VerifiedBadge";
import { InstallMenuItem } from "@/components/InstallUI";
import MenuButton from "@/components/MenuButton";
import { ProfileSkeleton } from "@/components/Skeletons";
import { useT } from "@/lib/i18n";
import { readSaved } from "@/lib/social";
import { fetchVerificationMe } from "@/lib/trust";
import { readFit } from "@/lib/pricing";
import { TOP_SELLERS_ENABLED } from "@/lib/productFlags";

const ViewsChart = dynamic(() => import("@/components/ViewsChart"), { ssr: false });

const menuItems = [
  { icon: FileText, label: "My requests", desc: "Requests you sent", href: "/maombi-yangu" },
  { icon: Inbox, label: "Requests I received", desc: "Requests on your listings", href: "/maombi-niliyopokea" },
  { icon: Home, label: "My Posts", desc: "Rooms, Airbnb, shop frames, materials and reels", href: "/mypost" },
  { icon: Heart, label: "Favorites", desc: "Listings you saved", href: "/favorites" },
  { icon: Receipt, label: "Receipts", desc: "Payments you made", href: "/risiti" },
  { icon: CreditCard, label: "Payments", desc: "How you pay", href: "/malipo" },
  { icon: Download, label: "Saved photos", desc: "Pictures kept on this phone", href: "/picha" },
  { icon: Hammer, label: "Construction jobs", desc: "Fundi and site work", href: "/kazi" },
  { icon: Settings, label: "Settings", desc: "Language, night mode, and help", href: "/settings" },
];

type Span = "day" | "week" | "month";
type Tab = "posts" | "stats" | "settings";

function inSpan(iso: string | undefined, span: Span) {
  if (!iso) return true;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return true;
  const age = Date.now() - at;
  if (span === "day") return age < 86400000;
  if (span === "week") return age < 7 * 86400000;
  return age < 30 * 86400000;
}

function viewTotal(item: Listing) {
  const n = item.views_count ?? item.views ?? item.view_count;
  return typeof n === "number" ? n : 0;
}

export default function ProfilePage() {
  const t = useT();
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [kind, setKind] = useState<"individual" | "business" | null>(null);
  const [revoked, setRevoked] = useState("");
  const [admin, setAdmin] = useState(false);
  const [span, setSpan] = useState<Span>("month");
  const [tab, setTab] = useState<Tab>("posts");
  const [listings, setListings] = useState<Listing[]>([]);
  const [board, setBoard] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setName(user.username || user.full_name || user.email || "User");
      setEmail(user.email || "");
      setVerified(Boolean(user.is_verified));
      setKind(user.verified_type === "business" || user.verified_type === "individual" ? user.verified_type : null);
      setRevoked(user.revoked_reason || "");
      setAdmin(Boolean(user.is_admin || user.role === "admin"));
    }
    setReady(true);
    fetchVerificationMe()
      .then((me) => {
        setVerified(Boolean(me.is_verified));
        setKind(me.verified_type === "business" || me.verified_type === "individual" ? me.verified_type : null);
        setRevoked(me.request?.status === "revoked" ? (me.request.revoked_reason || "") : "");
      })
      .catch(() => {});
    fetchMyPosts()
      .then((data) => setListings(data.listings || []))
      .catch(() => setListings([]));
    if (TOP_SELLERS_ENABLED) {
      fetchTopSellers("all").then((res) => setBoard(res.items.length >= 5)).catch(() => setBoard(false));
    }
  }, []);

  const saved = useMemo(() => (ready ? readSaved() : []), [ready]);
  const mine = listings.filter((item) => inSpan(item.created_at, span));
  const kept = saved.filter((item) => inSpan(item.saved_at, span));
  const views = mine.reduce((sum, item) => sum + viewTotal(item), 0);
  const withPhoto = listings.filter((item) => (item.images || []).some(Boolean)).length;
  const health = listings.length ? Math.round((withPhoto / listings.length) * 100) : 0;
  const poster = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of listings) {
      const value = readFit(item).poster_role;
      if (value === "owner" || value === "agent" || value === "caretaker" || value === "business") {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }
    let best = "";
    let n = 0;
    counts.forEach((count, key) => {
      if (count > n) {
        best = key;
        n = count;
      }
    });
    return best;
  }, [listings]);
  const role = admin ? t("profile.admin") : poster ? t(`fit.role.${poster}`) : kind === "business" ? t("profile.business") : "";
  const series = listings.flatMap((item) => {
    const n = item.views_count ?? item.views ?? item.view_count;
    if (typeof n !== "number" || !item.created_at) return [];
    return [{ at: item.created_at, views: n, title: item.title }];
  }).sort((a, b) => a.at.localeCompare(b.at));
  const initial = (name || "J").slice(0, 1).toUpperCase();

  return (
    <AuthGate>
    <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <MenuButton />
          <h1 className="page-title">{t("nav.profile")}</h1>
        </div>
      </header>

      {!ready ? (
        <ProfileSkeleton />
      ) : (
      <div className="profile-wrap">
        <section className="profile-hero">
          <div className="profile-avatar" aria-hidden>{initial}</div>
          <p className="profile-name">
            <span>{name}</span>
            {verified ? <VerifiedBadge size="lg" type={kind} shine /> : null}
            {role ? <span className="profile-role">{role}</span> : null}
          </p>
          <p className="profile-mail">
            <Mail size={12} />
            {email || t("profile.account")}
          </p>
          <div className="segment" role="group" aria-label={t("profile.span")} style={{ ["--seg" as string]: span === "day" ? "0%" : span === "week" ? "100%" : "200%" }}>
            {(["day", "week", "month"] as const).map((key) => (
              <button key={key} type="button" aria-pressed={span === key} className={span === key ? "is-on" : ""} onClick={() => setSpan(key)}>
                {t(`profile.span.${key}`)}
              </button>
            ))}
          </div>
          <div className="profile-stats">
            <p><strong>{mine.length}</strong><span>{t("profile.listings")}</span></p>
            <p><strong>{views}</strong><span>{t("profile.views")}</span></p>
            <p><strong>{kept.length}</strong><span>{t("profile.saved")}</span></p>
          </div>
        </section>

        <div className="underline-tabs" role="tablist">
          {(["posts", "stats", "settings"] as const).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-on" : ""} onClick={() => setTab(key)}>
              {t(`profile.tab.${key}`)}
            </button>
          ))}
        </div>

        {tab === "stats" ? (
          <div className="canvas-read px-5 space-y-4">
            <div className="stat-grid">
              <div className="stat-card"><span>{t("profile.listings")}</span><strong>{mine.length}</strong></div>
              <div className="stat-card"><span>{t("profile.views")}</span><strong>{views}</strong></div>
              <div className="stat-card"><span>{t("profile.saved")}</span><strong>{kept.length}</strong></div>
            </div>
            <ViewsChart points={series} />
            {board ? (
              <Link href="/wauzaji" className="health-row">
                <div><p>{t("sellers.title")}</p></div>
                <span className="see-all">{t("seeAll")} <i>›</i></span>
              </Link>
            ) : null}
            {listings.length > 0 ? (
              <Link href="/mypost" className="health-row">
                <div>
                  <p>{t("profile.health")}</p>
                  <small>{t("profile.healthNote", { n: withPhoto, total: listings.length })}</small>
                  <span className="health-bar"><i style={{ transform: `scaleX(${health / 100})` }} /></span>
                </div>
                <span className="see-all">{t("seeAll")} <i>›</i></span>
              </Link>
            ) : null}
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="canvas-read px-5">
            <div className="list-group">
              <Link href="/settings" className="list-row"><span className="list-ico"><Settings size={16} /></span><span><strong>{t("profile.tab.settings")}</strong></span><ChevronRight size={16} /></Link>
              <Link href="/hakiki" className="list-row"><span className="list-ico"><BadgeCheck size={16} /></span><span><strong>{t("verify.menu")}</strong><small>{verified ? t("badge.label") : t("verify.menuHint")}</small></span><ChevronRight size={16} /></Link>
            </div>
          </div>
        ) : null}

        {tab === "posts" ? (
        <div className="canvas-read px-5 space-y-5">
        {revoked ? (
          <p className="sheet px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
            {t("verify.revoked")} {revoked} {t("verify.support")}
          </p>
        ) : null}
        <Link href="/hakiki" className="sheet flex items-center gap-3 px-4 py-4">
          <div className="soft-icon-btn shrink-0">
            <BadgeCheck size={18} color="var(--mocha)" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{t("verify.menu")}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{verified ? t("badge.label") : t("verify.menuHint")}</p>
          </div>
          <ChevronRight size={16} color="var(--mocha)" />
        </Link>
        <Link
          href="/weka-tangazo"
          className="btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-semibold text-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t("post")}
        </Link>
        <div className="text-center">
          <AdminLink />
        </div>
        <InstallMenuItem variant="profile" />
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
        <ReportImpersonation targetType="profile" />
        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm sheet"
          style={{ color: "var(--error)" }}
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} strokeWidth={2} />
          {t("settings.logout")}
        </button>
        </div>
        ) : null}
      </div>
      )}
    </main>
    </AuthGate>
  );
}
