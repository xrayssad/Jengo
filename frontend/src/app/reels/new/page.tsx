"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Loader2 } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { createReel, uploadReelVideo } from "@/lib/api";

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

function readDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const n = el.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(n) ? n : 0);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video"));
    };
    el.src = url;
  });
}

export default function NewReelPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  const pick = async (next: File | null) => {
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    if (!next) return;
    if (!ALLOWED.has(next.type)) {
      setError("Use an MP4, MOV or WebM video");
      return;
    }
    if (next.size > 80 * 1024 * 1024) {
      setError("Video is too large. Use one under 80MB");
      return;
    }
    try {
      const seconds = await readDuration(next);
      if (seconds > 90) {
        setError("Keep the reel under 90 seconds");
        return;
      }
    } catch {
      setError("Could not read the video");
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const submit = async () => {
    if (!file) {
      setError("Choose a video first");
      return;
    }
    setBusy(true);
    setError("");
    setPct(0);
    try {
      const uploaded = await uploadReelVideo(file, setPct);
      await createReel({
        caption: caption.trim(),
        video_url: uploaded.video_url,
        public_id: uploaded.public_id,
        thumb_url: uploaded.thumb_url,
      });
      router.replace("/reels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the reel");
      setBusy(false);
    }
  };

  return (
    <AuthGate>
      <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
        <header className="sticky top-0 z-20 px-5 py-4 glass">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/reels" className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Post a reel</h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>A short video of the place or stock</p>
            </div>
          </div>
        </header>
        <div className="max-w-md mx-auto px-5 pt-5 pb-8 space-y-4">
          <label className="block overflow-hidden rounded-[28px]" style={{ backgroundColor: "var(--ink-2)", minHeight: 360 }}>
            {preview ? (
              <video src={preview} className="w-full h-[360px] object-cover" controls muted playsInline />
            ) : (
              <span className="h-[360px] flex flex-col items-center justify-center gap-2">
                <Clapperboard size={32} color="var(--gold)" />
                <span className="text-sm" style={{ color: "#FFF6ED" }}>Tap to choose a video</span>
              </span>
            )}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0] || null)}
            />
          </label>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink)" }}>Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 240))}
              rows={3}
              placeholder="What should people see?"
              className="input-chocolate w-full px-4 py-3 text-sm"
            />
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{caption.length}/240</p>
          </div>
          {error ? <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{error}</p> : null}
          {busy ? (
            <p className="text-sm" style={{ color: "var(--mocha)" }}>Uploading to Cloudinary… {pct}%</p>
          ) : null}
          <button type="button" disabled={busy} onClick={submit} className="btn-primary w-full py-4 rounded-full text-sm font-semibold">
            {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Posting...</span> : "Post reel"}
          </button>
        </div>
      </main>
    </AuthGate>
  );
}
