"use client";

import { ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import Link from "next/link";

const methods = [
  { icon: Smartphone, title: "M-Pesa / Mixx", desc: "Malipo kwa simu" },
  { icon: Smartphone, title: "Tigo Pesa / Airtel Money", desc: "Mobile money" },
  { icon: Building2, title: "Benki", desc: "Uhamisho wa benki" },
  { icon: CreditCard, title: "Kadi", desc: "Visa / Mastercard (baadaye)" },
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: "#FFF6ED" }}>
      <header className="sticky top-0 z-20 px-4 py-3.5 glass">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} strokeWidth={2.2} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl leading-none" style={{ color: "#2E1A0F" }}>Malipo</h1>
            <p className="text-sm" style={{ color: "#5C4033" }}>Njia na historia</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        <div>
          <h2 className="font-heading text-xl mb-3" style={{ color: "#2E1A0F" }}>Njia za malipo</h2>
          <div className="space-y-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="flex items-center gap-3 p-3.5 sheet rounded-[24px]"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
                    <Icon size={18} color="#8B5E3C" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#2E1A0F" }}>{m.title}</p>
                    <p className="text-xs" style={{ color: "#5C4033" }}>{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-xl mb-3" style={{ color: "#2E1A0F" }}>Historia</h2>
          <div className="p-6 sheet rounded-[24px] text-center">
            <p className="font-heading text-2xl" style={{ color: "#2E1A0F" }}>Hakuna malipo bado</p>
            <p className="text-sm mt-1" style={{ color: "#5C4033" }}>
              Malipo halisi yataunganishwa baadaye.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: "#8B5E3C" }}>
          Malipo halisi yataunganishwa na backend (Selcom / ClickPesa)
        </p>
      </div>
    </main>
  );
}
