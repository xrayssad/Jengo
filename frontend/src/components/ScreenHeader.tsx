"use client";

import { ArrowLeft } from "lucide-react";

export default function ScreenHeader({
  title,
  note,
  onBack,
  backLabel,
  compact = false,
  step = 0,
  steps = 0,
}: {
  title: string;
  note?: string;
  onBack: () => void;
  backLabel: string;
  compact?: boolean;
  step?: number;
  steps?: number;
}) {
  return (
    <header className={compact ? "screen-header is-compact" : "screen-header"}>
      <button type="button" className="soft-icon-btn shrink-0" aria-label={backLabel} onClick={onBack}>
        <ArrowLeft size={18} />
      </button>
      <div className="min-w-0">
        <h1>{title}</h1>
        {note ? <p className="wizard-step-label">{note}</p> : null}
      </div>
      {steps > 0 ? (
        <div className="step-dots" role="progressbar" aria-valuemin={1} aria-valuemax={steps} aria-valuenow={step}>
          {Array.from({ length: steps }, (_, index) => (
            <i key={index} className={index < step ? "is-on" : ""} />
          ))}
        </div>
      ) : null}
    </header>
  );
}
