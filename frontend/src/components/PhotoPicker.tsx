"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import JengoLoader from "@/components/JengoLoader";
import { uploadPhoto } from "@/lib/api";

export default function PhotoPicker({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = 6 - urls.length;
    const batch = Array.from(files).slice(0, room);
    if (!batch.length) {
      setError("Six photos is enough.");
      return;
    }
    setBusy(true);
    setPct(0);
    setError("");
    try {
      const uploaded: string[] = [];
      for (let index = 0; index < batch.length; index += 1) {
        const file = batch[index];
        const res = await uploadPhoto(file, false, (value) => {
          setPct(Math.round(((index + value / 100) / batch.length) * 100));
        });
        if (res.url) uploaded.push(res.url);
      }
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          <div key={url} className="relative overflow-hidden" style={{ height: 92, borderRadius: 16, border: "1px solid var(--mocha)" }}>
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
              aria-label="Remove photo"
            >
              <X size={12} color="var(--paper)" />
            </button>
          </div>
        ))}
        {urls.length < 6 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-1"
            style={{ height: 92, borderRadius: 16, border: "1px dashed var(--mocha)", color: "var(--mocha)" }}
          >
            {busy ? <JengoLoader size={28} progress={pct} showValue /> : <ImagePlus size={18} />}
            <span className="text-[11px]">{busy ? "Uploading" : "Add photo"}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs mt-2" style={{ color: "var(--error)" }}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}
