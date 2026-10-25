"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { fetchComments, getAuthUser, likeComment, postComment, type ListingComment } from "@/lib/api";

export default function CommentThread({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<ListingComment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loggedIn = Boolean(getAuthUser()?.access_token);

  const load = async () => {
    const res = await fetchComments(listingId);
    setItems(res.items || []);
  };

  useEffect(() => {
    load().catch(() => setError("Maoni hayakupakiwa"));
  }, [listingId]);

  const tree = useMemo(() => {
    const roots = items.filter((c) => !c.parent_id);
    const kids = (id: string) => items.filter((c) => c.parent_id === id);
    return { roots, kids };
  }, [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await postComment(listingId, text.trim(), replyTo || undefined);
      setItems((cur) => [...cur, created]);
      setText("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Maoni hayakuenda");
    } finally {
      setBusy(false);
    }
  };

  const heart = async (id: string) => {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    const res = await likeComment(id);
    setItems((cur) => cur.map((c) => (c.id === id ? { ...c, likes_count: res.likes_count, liked: res.liked } : c)));
  };

  const Row = ({ c, nested }: { c: ListingComment; nested?: boolean }) => (
    <div className={nested ? "ml-6 mt-3" : "mt-4"}>
      <p className="text-sm font-semibold" style={{ color: "#2E1A0F" }}>{c.author || "Mtumiaji"}</p>
      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "#5C4033" }}>{c.body}</p>
      <div className="flex items-center gap-4 mt-1.5">
        <button type="button" onClick={() => heart(c.id)} className="flex items-center gap-1 text-xs font-semibold">
          <Heart size={14} color={c.liked ? "#A6452E" : "#8B5E3C"} fill={c.liked ? "#A6452E" : "none"} />
          <span style={{ color: "#2E1A0F" }}>{c.likes_count || 0}</span>
        </button>
        <button type="button" onClick={() => setReplyTo(c.id)} className="text-xs font-semibold" style={{ color: "#8B5E3C" }}>
          Jibu
        </button>
      </div>
    </div>
  );

  return (
    <section id="maoni" className="pt-2">
      <h3 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Maoni</h3>
      <p className="text-sm mt-1 mb-3" style={{ color: "#5C4033" }}>
        Maoni ni ya umma. Ujumbe wa moja kwa moja uko kwenye ikoni ya ujumbe.
      </p>
      {error && <p className="text-sm font-semibold mb-2" style={{ color: "#A6452E" }}>{error}</p>}
      {tree.roots.length === 0 && <p className="text-sm" style={{ color: "#5C4033" }}>Anza maoni.</p>}
      {tree.roots.map((c) => (
        <div key={c.id}>
          <Row c={c} />
          {tree.kids(c.id).map((r) => (
            <Row key={r.id} c={r} nested />
          ))}
        </div>
      ))}
      <form onSubmit={submit} className="mt-5 space-y-2">
        {replyTo && (
          <button type="button" onClick={() => setReplyTo(null)} className="text-xs font-semibold" style={{ color: "#8B5E3C" }}>
            Sitisha jibu
          </button>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? "Andika jibu" : "Andika maoni"}
          rows={3}
          className="input-chocolate w-full px-4 py-3 text-sm resize-none"
        />
        <button type="submit" disabled={busy} className="btn-primary px-5 py-3 rounded-full text-sm font-semibold">
          {busy ? "Inatuma..." : replyTo ? "Tuma jibu" : "Tuma maoni"}
        </button>
      </form>
    </section>
  );
}
