"use client";

import { useEffect, useState } from "react";
import { readScoped } from "@/lib/userScope";

export default function ProfileName() {
  const [name, setName] = useState("Mtumiaji Demo");
  useEffect(() => {
    const saved = readScoped("profile_name")?.trim();
    if (saved) setName(saved);
  }, []);
  return <>{name}</>;
}
