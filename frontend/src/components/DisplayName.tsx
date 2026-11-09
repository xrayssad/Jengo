"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DisplayName() {
  const [name, setName] = useState("");
  useEffect(() => {
    setName(localStorage.getItem("jengo_profile_name") || "");
  }, []);

  return (
    <div className="canvas-read px-5 pt-4">
      <div className="p-4 sheet rounded-[24px]">
        <p className="text-sm" style={{ color: "var(--mocha)" }}>Your name</p>
        <p className="text-xl font-semibold mt-1" style={{ color: "var(--text)" }}>{name || "No name yet"}</p>
        {!name && (
          <Link href="/settings" className="text-sm font-semibold" style={{ color: "var(--mocha)" }}>Set it in Settings</Link>
        )}
      </div>
    </div>
  );
}
