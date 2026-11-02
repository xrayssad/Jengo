"use client";

import { useEffect } from "react";
import { afterAuthPath, getAuthUser } from "@/lib/api";

/** If a session is already saved, skip landing/login like TikTok/Instagram. */
export default function SignedInHome() {
  useEffect(() => {
    const user = getAuthUser();
    if (user?.access_token) {
      window.location.replace(afterAuthPath(user));
    }
  }, []);
  return null;
}
