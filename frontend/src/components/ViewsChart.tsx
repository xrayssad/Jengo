"use client";

import { useRef, useState } from "react";

export type ViewPoint = { at: string; views: number; title: string };

function smooth(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    const cx = (prev.x + cur.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

export default function ViewsChart({ points }: { points: ViewPoint[] }) {
  const svg = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  if (points.length < 2) return null;
  const width = 320;
  const height = 140;
  const pad = 12;
  const max = Math.max(...points.map((point) => point.views), 1);
  const plot = points.map((point, i) => ({
    x: pad + (i / (points.length - 1)) * (width - pad * 2),
    y: height - pad - (point.views / max) * (height - pad * 2),
  }));
  const line = smooth(plot);
  const fill = `${line} L ${plot[plot.length - 1].x} ${height - pad} L ${plot[0].x} ${height - pad} Z`;
  const active = index == null ? null : points[index];

  const scrub = (clientX: number) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect?.width) return;
    const x = ((clientX - rect.left) / rect.width) * width;
    let best = 0;
    let dist = Infinity;
    plot.forEach((point, i) => {
      const gap = Math.abs(point.x - x);
      if (gap < dist) {
        dist = gap;
        best = i;
      }
    });
    setIndex(best);
  };

  return (
    <div className="views-chart">
      <svg
        ref={svg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Views"
        onPointerDown={(event) => scrub(event.clientX)}
        onPointerMove={(event) => {
          if (event.buttons) scrub(event.clientX);
        }}
        onPointerLeave={() => setIndex(null)}
      >
        <defs>
          <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#views-fill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" />
        {index != null ? <circle cx={plot[index].x} cy={plot[index].y} r="4" fill="var(--primary)" /> : null}
      </svg>
      {active ? (
        <p className="views-tip" style={{ left: `${(plot[index || 0].x / width) * 100}%` }}>
          <strong>{active.views}</strong>
          <span>{active.at.slice(0, 10)}</span>
        </p>
      ) : null}
    </div>
  );
}
