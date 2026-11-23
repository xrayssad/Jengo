"use client";

import { useEffect, useState } from "react";
import { debugGeoEnabled, readGeoLog, type GeoLog } from "@/lib/geo";

export default function GeoDebug() {
  const [on, setOn] = useState(false);
  const [log, setLog] = useState<GeoLog | null>(null);

  useEffect(() => {
    if (!debugGeoEnabled()) return;
    setOn(true);
    const paint = () => setLog(readGeoLog());
    paint();
    const id = window.setInterval(paint, 400);
    return () => window.clearInterval(id);
  }, []);

  if (!on || !log) return null;
  return <pre className="geo-debug">{JSON.stringify(log, null, 2)}</pre>;
}
