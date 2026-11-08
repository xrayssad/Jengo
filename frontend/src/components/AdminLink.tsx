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
    <Link href="/admin" className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>
      Admin
    </Link>
  );
}
