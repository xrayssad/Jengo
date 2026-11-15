"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ReportImpersonation({
  targetType,
  targetId = "",
}: {
  targetType: "listing" | "profile";
  targetId?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(targetId);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const ident = (targetType === "listing" ? targetId : name).trim();
    if (ident.length < 2) return;
    setError("");
    try {
      await apiSend("/reports", {
        method: "POST",
        body: JSON.stringify({ target_type: targetType, target_id: ident, reason_code: "impersonation" }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("report.fail"));
    }
  };

  return (
    <div className="report-impersonation">
      <button type="button" className="report-link" onClick={() => setOpen((v) => !v)}>
        {t("report.impersonation")}
      </button>
      {open ? (
        <div className="report-box">
          {targetType === "profile" ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("report.username")}
              className="input-chocolate w-full px-4 py-3 text-sm"
              aria-label={t("report.username")}
            />
          ) : (
            <p>{t("report.listing")}</p>
          )}
          {error ? <p className="report-error">{error}</p> : null}
          {sent ? <p className="report-ok">{t("report.sent")}</p> : (
            <button type="button" className="btn-primary report-send" onClick={() => void submit()}>
              {t("report.send")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
