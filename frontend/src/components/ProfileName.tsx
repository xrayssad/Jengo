"use client";

import { useEffect, useState } from "react";

export default function ProfileName() {
  const [name, setName] = useState("Mtumiaji Demo");
  useEffect(() => {
    const saved = localStorage.getItem("jengo_profile_name")?.trim();
    if (saved) setName(saved);
  }, []);
  return <>{name}</>;
}
