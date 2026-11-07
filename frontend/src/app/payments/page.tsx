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
      <header
        className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ backgroundColor: "rgba(var(--paper-rgb),0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="soft-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft size={18} strokeWidth={2.2} color="var(--ink)" />
          </Link>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>Wallet</p>
            <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight" style={{ color: "var(--ink)" }}>Payments</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Methods and history</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-6">
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
