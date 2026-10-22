"use client";

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type AlertKind = "success" | "error" | "info" | "warning";

type Props = {
  open: boolean;
  kind?: AlertKind;
  title: string;
  message?: string;
  onClose: () => void;
};

const styles: Record<AlertKind, { bg: string; icon: typeof CheckCircle2; color: string }> = {
  success: { bg: "linear-gradient(145deg, #5E7F4F, #3D5C34)", icon: CheckCircle2, color: "#FFF6ED" },
  error: { bg: "linear-gradient(145deg, #A6452E, #7A2E1C)", icon: AlertTriangle, color: "#FFF6ED" },
  warning: { bg: "linear-gradient(145deg, #8B5E3C, #5C3D28)", icon: AlertTriangle, color: "#FFF6ED" },
  info: { bg: "linear-gradient(145deg, #3D2415, #2E1A0F)", icon: Info, color: "#FFF6ED" },
};

export default function AppAlert({ open, kind = "info", title, message, onClose }: Props) {
  if (!open) return null;
  const s = styles[kind];
  const Icon = s.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(26,15,8,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[22px] overflow-hidden shadow-xl"
        style={{ backgroundColor: "#FFF6ED", border: "1.5px solid #3D2415" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 flex gap-3 items-start" style={{ background: s.bg }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,246,237,0.2)" }}>
            <Icon size={24} color={s.color} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-base" style={{ color: s.color }}>{title}</p>
            {message && <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,246,237,0.85)" }}>{message}</p>}
          </div>
          <button type="button" onClick={onClose} className="shrink-0 p-1">
            <X size={18} color={s.color} />
          </button>
        </div>
        <div className="p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-[14px] font-semibold text-sm"
            style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED" }}
          >
            Sawa
          </button>
        </div>
      </div>
    </div>
  );
}
