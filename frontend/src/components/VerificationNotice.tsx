"use client";

import { useEffect, useState } from "react";
import { isSignedIn } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { fetchVerificationMe } from "@/lib/trust";

const KEY = "jengo_ver_status";

export default function VerificationNotice() {
  const t = useT();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isSignedIn()) return;
    let stop = false;
    const tick = async () => {
      try {
        const me = await fetchVerificationMe();
        if (stop) return;
        const status = me.request?.status || (me.is_verified ? "approved" : "");
        let prev = "";
        try {
          prev = sessionStorage.getItem(KEY) || "";
          if (status) sessionStorage.setItem(KEY, status);
        } catch {
          prev = "";
        }
        if (prev && status && prev !== status && (status === "approved" || status === "rejected" || status === "revoked")) {
          setNote(t(`verify.notice.${status}`));
        }
      } catch {
        /* decision polling is quiet */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 45000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [t]);

  if (!note) return null;
  return (
    <div className="browse-toast verify-notice" role="status">
      <p>{note}</p>
      <button type="button" onClick={() => setNote("")} aria-label={t("close")}>
        {t("close")}
      </button>
    </div>
  );
}
