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
      <div className="p-4 sheet rounded-[24px]">
        <p className="text-sm" style={{ color: "#8B5E3C" }}>Jina lako</p>
        <p className="font-heading text-xl mt-1" style={{ color: "#2E1A0F" }}>{name || "Hujaweka jina"}</p>
        {!name && (
          <Link href="/settings" className="text-sm font-semibold" style={{ color: "#8B5E3C" }}>Weka kwenye Mipangilio</Link>
        )}
      </div>
    </div>
  );
}
