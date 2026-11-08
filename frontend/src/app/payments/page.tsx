"use client";

import { ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import Link from "next/link";

const methods = [
  { icon: Smartphone, title: "M-Pesa / Mixx", desc: "Pay by phone" },
  { icon: Smartphone, title: "Tigo Pesa / Airtel Money", desc: "Mobile money" },
  { icon: Building2, title: "Bank", desc: "Bank transfer" },
  { icon: CreditCard, title: "Card", desc: "Visa / Mastercard (later)" },
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "var(--paper)" }}>
      <header className="topbar">
        <div className="canvas-read flex items-center gap-3 px-5">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">Payments</h1>
            <p className="page-note">Methods and history</p>
          </div>
        </div>
      </header>

      <div className="canvas-read px-5 pt-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>Payment methods</h2>
          <div className="space-y-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="flex items-center gap-3 p-3.5 sheet"
                >
                  <div className="soft-icon-btn shrink-0">
                    <Icon size={18} color="var(--mocha)" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{m.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>History</h2>
          <div className="p-6 sheet text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>No payments yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Live payments will be connected later.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--mocha)" }}>
          Live payments will connect to the backend (Selcom / ClickPesa)
        </p>
      </div>
    </main>
  );
}
