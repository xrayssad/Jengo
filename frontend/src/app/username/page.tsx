"use client";

import { useEffect, useState } from "react";
import { getAuthUser, setUsername } from "@/lib/api";

export default function UsernamePage() {
  const [username, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.access_token) {
      window.location.href = "/login";
      return;
    }
    if (!user.needs_username) {
      window.location.href = "/home";
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = username.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
      setError("Username: herufi 3–20, herufi, namba au _");
      return;
    }
    setBusy(true);
    try {
      await setUsername(value);
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuhifadhi username");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="soft-card w-full max-w-sm p-6 fade-up">
        <h1 className="font-heading text-3xl mb-2" style={{ color: "#2E1A0F" }}>Chagua username</h1>
        <p className="text-sm mb-8" style={{ color: "#5C4033" }}>
          Akaunti ya Google iko tayari. Weka username mara moja, kisha utaenda nyumbani.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            required
            value={username}
            onChange={(e) => setName(e.target.value)}
            placeholder="jengo_duka"
            className="input-chocolate w-full px-4 py-3.5 text-sm"
          />
          {error && <p className="text-sm font-semibold" style={{ color: "#A6452E" }}>{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
            {busy ? "Inahifadhi..." : "Endelea"}
          </button>
        </form>
      </div>
    </main>
  );
}
