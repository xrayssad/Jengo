"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DisplayName() {
  const [name, setName] = useState("");
  useEffect(() => {
    setName(localStorage.getItem("jengo_profile_name") || "");
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="p-4 rounded-[18px]" style={{ backgroundColor: "white", border: "1px solid rgba(61,36,21,0.12)" }}>
        <p className="text-[11px] uppercase tracking-wide" style={{ color: "#8B5E3C" }}>Jina lako</p>
        <p className="text-lg font-bold mt-1" style={{ color: "#2E1A0F" }}>{name || "Hujaweka jina"}</p>
        {!name && (
          <Link href="/settings" className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>Weka kwenye Mipangilio</Link>
        )}
      </div>
    </div>
  );
}
