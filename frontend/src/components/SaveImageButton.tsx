"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Download } from "lucide-react";
import { isImageSaved, toggleSavedImage } from "@/lib/savedImages";

export default function SaveImageButton({ id, title, url }: { id: string; title: string; url?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (url) setOn(isImageSaved(id, url));
  }, [id, url]);
  if (!url) return null;

  const press = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOn(toggleSavedImage(id, title, url));
  };

  return (
    <button type="button" aria-label="Save photo" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={press}>
      <Download size={22} color="#2E1A0F" fill={on ? "#2E1A0F" : "none"} />
    </button>
  );
}
