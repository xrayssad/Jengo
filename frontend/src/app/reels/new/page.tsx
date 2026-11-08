"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Loader2 } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { createReel, REEL_MAX_BYTES, uploadReelVideo } from "@/lib/api";
import { armReelVideo } from "@/lib/reelsMedia";

function isPhotoFile(file: File) {
  const type = (file.type || "").toLowerCase();
  const name = file.name || "";
  if (/\.(mp4|m4v|mov|qt|webm|3gp|3gpp|mkv|avi|ts)$/i.test(name)) return false;
  if (type.startsWith("video/")) return false;
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(name);
}

export default function NewReelPage() {
  const router = useRouter();
  const previewEl = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    armReelVideo(previewEl.current);
  }, [preview]);

  const pick = (next: File | null) => {
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    if (!next) return;
    if (isPhotoFile(next)) {
      setError("Use a video from the camera roll, not a photo");
      return;
    }
    if (next.size > REEL_MAX_BYTES) {
      setError("This reel could not post. Use a video under 250MB");
      return;
    }
    // Do not block on HTML5 duration. Some phones still report the old 90s
    // limit or read HEVC/MOV length as milliseconds. Cloudinary trims to 3 min.
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
      setError(err instanceof Error ? err.message : "This reel could not post");
      setBusy(false);
    }
  };

  return (
    <AuthGate>
      <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
        <header className="topbar">
          <div className="canvas-read flex items-center gap-3 px-5">
            <Link href="/reels" className="soft-icon-btn shrink-0" aria-label="Back">
              <ArrowLeft size={18} color="var(--ink)" />
            </Link>
            <div className="min-w-0">
              <h1 className="page-title">Post a reel</h1>
              <p className="page-note">Up to 3 minutes · 2:10 is OK · Android & iPhone</p>
            </div>
          </div>
        </header>
        <div className="canvas-read px-5 pt-6 pb-8 space-y-4">
          <label className="block overflow-hidden rounded-[28px]" style={{ backgroundColor: "var(--ink-2)", minHeight: 360 }}>
            {preview ? (
              <video
                ref={previewEl}
                src={preview}
                className="w-full h-[360px] object-cover"
                controls
                playsInline
                muted
                preload="metadata"
              />
            ) : (
              <span className="h-[360px] flex flex-col items-center justify-center gap-2 px-8 text-center">
                <Clapperboard size={32} color="var(--gold)" />
                <span className="text-sm" style={{ color: "#FFF6ED" }}>Tap to choose a video</span>
                <span className="text-xs" style={{ color: "rgba(255,246,237,0.72)" }}>
                  Any camera-roll video up to 3 minutes
                </span>
              </span>
            )}
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0] || null;
                e.target.value = "";
                pick(picked);
              }}
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
            <div className="space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(var(--ink-rgb), 0.12)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: "var(--ink)", transition: "width 0.2s ease" }}
                />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Uploading {pct}%</p>
            </div>
          ) : null}
          <button type="button" disabled={busy} onClick={submit} className="btn-primary w-full py-4 text-sm">
            {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Uploading {pct}%</span> : "Post reel"}
          </button>
        </div>
      </main>
    </AuthGate>
  );
}
