"use client";

import { ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import Link from "next/link";

const methods = [
  { icon: Smartphone, title: "M-Pesa / Mixx", desc: "Malipo kwa simu" },
  { icon: Smartphone, title: "Tigo Pesa / Airtel Money", desc: "Mobile money" },
  { icon: Building2, title: "Benki", desc: "Uhamisho wa benki" },
  { icon: CreditCard, title: "Kadi", desc: "Visa / Mastercard (baadaye)" },
];

const history = [
  { id: 1, title: "Ada ya tangazo — Apartment Masaki", amount: "15,000", date: "20 Okt 2026", status: "Imelipwa" },
  { id: 2, title: "Kamisheni — Godown Mikocheni", amount: "45,000", date: "18 Okt 2026", status: "Imelipwa" },
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.4)" }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#2E1A0F" }}>Malipo</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Payments & historia</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#2E1A0F" }}>Njia za malipo</h2>
          <div className="space-y-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="flex items-center gap-3 p-3.5 rounded-[16px]"
                  style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF6ED" }}>
                    <Icon size={18} color="#8B5E3C" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#2E1A0F" }}>{m.title}</p>
                    <p className="text-xs" style={{ color: "#5C4033" }}>{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#2E1A0F" }}>Historia</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-[16px]"
                style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium" style={{ color: "#2E1A0F" }}>{h.title}</p>
                  <p className="text-sm font-bold shrink-0" style={{ color: "#2E1A0F" }}>TZS {h.amount}</p>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: "#5C4033" }}>{h.date}</span>
                  <span className="text-xs font-semibold" style={{ color: "#5E7F4F" }}>{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: "#8B5E3C" }}>
          Malipo halisi yataunganishwa na backend (Selcom / ClickPesa)
        </p>
      </div>
    </main>
  );
}
