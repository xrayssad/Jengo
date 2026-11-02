"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import AppAlert, { type AlertKind } from "@/components/AppAlert";
import PhotoPicker from "@/components/PhotoPicker";
import PlacePicker, { type PlaceValue } from "@/components/PlacePicker";
import { createJob } from "@/lib/api";

const samples = ["Paint", "Tiles", "Ceiling", "Plumbing", "Electrical", "Repairs"];

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [place, setPlace] = useState<PlaceValue>({ location: "", city: "", lat: null, lng: null });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const show = (kind: AlertKind, titleText: string, msg?: string) => {
    setAlertKind(kind);
    setAlertTitle(titleText);
    setAlertMsg(msg || "");
    setAlertOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || !place.location.trim() || !deadline) {
      show("error", "Fill the form", "Title, location and date are required.");
      return;
    }
    setLoading(true);
    try {
      const created = await createJob({
        title: title.trim(),
        description: description.trim(),
        location: place.location.trim(),
        city: place.city.trim(),
        deadline,
        images: photos.slice(0, 6),
      });
      router.replace(`/kazi/${created.id}`);
    } catch (err) {
      show("error", "Could not post the job", err instanceof Error ? err.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <main className="min-h-screen pb-10 overflow-x-hidden" style={{ backgroundColor: "var(--paper)" }}>
        <header className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 glass">
          <button type="button" onClick={() => router.push("/kazi")} className="w-10 h-10 rounded-full flex items-center justify-center icon-glass">
            <ArrowLeft size={18} color="var(--ink)" />
          </button>
          <h1 className="font-heading text-2xl" style={{ color: "var(--ink)" }}>Post a job</h1>
        </header>

        <form onSubmit={submit} className="max-w-md mx-auto px-4 pt-5">
          <div className="sheet rounded-[28px] p-5 space-y-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Examples of small jobs</p>
            <div className="flex flex-wrap gap-2">
              {samples.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTitle(name)}
                  className={`px-3 py-2 text-xs ${title === name ? "rounded-full" : "chip"}`}
                  style={title === name ? { backgroundColor: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink)" }}
                >
                  {name}
                </button>
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="input-chocolate w-full px-4 py-3.5 text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Details: walls, rooms, materials" className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" />
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Deadline</p>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input-chocolate w-full px-4 py-3.5 text-sm" />
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Photos</p>
              <PhotoPicker urls={photos} onChange={setPhotos} />
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Location</p>
              <PlacePicker value={place} onChange={setPlace} />
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              The connection fee is shown after a worker offers, before you choose. No fee if nobody offers.
            </p>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Saving..." : "Post job"}
            </button>
          </div>
        </form>
        <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
      </main>
    </AuthGate>
  );
}
