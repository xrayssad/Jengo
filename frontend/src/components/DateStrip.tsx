"use client";

import { useMemo } from "react";

function localISO(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function DateStrip({
  value,
  onChange,
  count = 10,
}: {
  value: string;
  onChange: (iso: string) => void;
  count?: number;
}) {
  const days = useMemo(() => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        iso: localISO(date),
        week: date.toLocaleDateString(undefined, { weekday: "short" }),
        date: date.getDate(),
      };
    });
  }, [count]);

  return (
    <div className="date-strip no-scrollbar rail-fade" role="listbox">
      {days.map((day) => (
        <button
          key={day.iso}
          type="button"
          role="option"
          aria-selected={value === day.iso}
          className={value === day.iso ? "date-chip is-on" : "date-chip"}
          onClick={() => onChange(day.iso)}
        >
          <span>{day.week}</span>
          <strong>{day.date}</strong>
        </button>
      ))}
    </div>
  );
}
