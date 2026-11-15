"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchListing, formatPrice, type Listing } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { quoteStay, readFit } from "@/lib/pricing";

export default function ComparePage() {
  const t = useT();
  const [rows, setRows] = useState<Listing[]>([]);

  useEffect(() => {
    const ids = JSON.parse(sessionStorage.getItem("jengo_compare") || "[]") as string[];
    void Promise.all(ids.slice(0, 3).map((id) => fetchListing(id).catch(() => null))).then((items) => {
      setRows(items.filter((item): item is Listing => Boolean(item)));
    });
  }, []);

  const facts = (item: Listing) => {
    const fit = readFit(item);
    return [
      [t("fit.due"), formatPrice(quoteStay(item).due || item.price)],
      [t("fit.role.owner"), fit.poster_role ? t(`fit.role.${fit.poster_role}`) : "—"],
      [t("fit.direct"), fit.direct_owner ? t("fit.direct") : "—"],
      [t("fit.costs"), fit.costs_confirmed ? t("fit.costs") : "—"],
      [t("fit.landmark"), item.city || item.location || "—"],
    ];
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="topbar">
        <div className="canvas flex items-center gap-3 px-4">
          <Link href="/home" className="soft-icon-btn" aria-label={t("back")}><ArrowLeft size={18} /></Link>
          <h1 className="page-title">{t("fit.compare")}</h1>
        </div>
      </header>
      <div className="canvas px-4 pt-6 overflow-x-auto">
        {rows.length === 0 ? <p className="fit-note">{t("empty.all")}</p> : (
          <table className="fit-sheet" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th />
                {rows.map((item) => <th key={item.id} style={{ textAlign: "left", padding: 8 }}><Link href={`/tangazo/${item.id}`}>{item.title}</Link></th>)}
              </tr>
            </thead>
            <tbody>
              {facts(rows[0]).map((_, index) => (
                <tr key={index}>
                  <td style={{ padding: 8, color: "var(--muted)" }}>{facts(rows[0])[index][0]}</td>
                  {rows.map((item) => <td key={item.id} style={{ padding: 8 }}>{facts(item)[index]?.[1] || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
