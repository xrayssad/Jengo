"use client";

import { Menu } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function MenuButton() {
  const t = useT();
  return (
    <button
      type="button"
      className="menu-btn"
      aria-label={t("menu")}
      onClick={() => window.dispatchEvent(new Event("jengo-drawer-open"))}
    >
      <Menu size={18} strokeWidth={2.2} />
    </button>
  );
}
