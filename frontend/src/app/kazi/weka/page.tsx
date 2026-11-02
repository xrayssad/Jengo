"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import AppAlert, { type AlertKind } from "@/components/AppAlert";
import PhotoPicker from "@/components/PhotoPicker";
import PlacePicker, { type PlaceValue } from "@/components/PlacePicker";
import { createJob } from "@/lib/api";

const samples = ["Rangi", "Tiles", "Dari", "Mabomba", "Umeme", "Ukarabati"];

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
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
    if (title.trim().length < 3 || !budget || !place.location.trim() || !deadline) {
      show("error", "Jaza sehemu", "Kichwa, bajeti, eneo na tarehe vinahitajika.");
      return;
    }
    setLoading(true);
    try {
      const created = await createJob({
        title: title.trim(),
        description: description.trim(),
        location: place.location.trim(),
        city: place.city.trim(),
        budget: Number(budget),
        deadline,
        images: photos.slice(0, 6),
      });
      router.replace(`/kazi/${created.id}`);
    } catch (err) {
      show("error", "Imeshindwa kuweka kazi", err instanceof Error ? err.message : "Jaribu tena.");
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
          <h1 className="font-heading text-2xl" style={{ color: "var(--ink)" }}>Weka kazi</h1>
        </header>

        <form onSubmit={submit} className="max-w-md mx-auto px-4 pt-5">
          <div className="sheet rounded-[28px] p-5 space-y-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Mfano wa kazi ndogo</p>
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kichwa cha kazi" className="input-chocolate w-full px-4 py-3.5 text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Maelezo: ukuta, idadi ya vyumba, vifaa" className="input-chocolate w-full px-4 py-3.5 text-sm resize-none" />
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Bajeti (TSh)" inputMode="numeric" className="input-chocolate w-full px-4 py-3.5 text-sm" />
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Tarehe ya mwisho</p>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input-chocolate w-full px-4 py-3.5 text-sm" />
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Picha</p>
              <PhotoPicker urls={photos} onChange={setPhotos} />
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Eneo</p>
              <PlacePicker value={place} onChange={setPlace} />
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Ada ya kuunganisha inaonyeshwa baada ya fundi kuweka ofa, kabla hujamchagua. Hakuna ada kama hakuna fundi.
            </p>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Inahifadhi..." : "Weka kazi"}
            </button>
          </div>
        </form>
        <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
      </main>
    </AuthGate>
  );
}
