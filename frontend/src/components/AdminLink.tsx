"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { refreshAuth } from "@/lib/api";

export default function AdminLink() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let stop = false;
    refreshAuth()
      .then((me) => {
        if (!stop) setShow(Boolean(me?.is_admin));
      })
      .catch(() => {
        if (!stop) setShow(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  if (!show) return null;
  return (
    <Link href="/admin" className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#8B5E3C" }}>
      Admin
    </Link>
  );
}
