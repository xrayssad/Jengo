import { readScoped, writeScoped } from "./userScope";

export type ChatMsg = { id: string; text: string; mine: boolean; at: string };

const threadKey = (listingId: string) => `chat:${listingId}`;

export function readChat(listingId: string): ChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readScoped(threadKey(listingId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function sendChat(listingId: string, text: string, title: string) {
  const msg: ChatMsg = {
    id: crypto.randomUUID(),
    text,
    mine: true,
    at: new Date().toISOString(),
  };
  const all = readChat(listingId);
  all.push(msg);
  writeScoped(threadKey(listingId), JSON.stringify(all));
  const idx = readIndex().filter((x) => x.listing_id !== listingId);
  idx.unshift({ listing_id: listingId, title, last: text, at: msg.at });
  writeScoped("chat_index", JSON.stringify(idx.slice(0, 50)));
  return all;
}

export type ChatIndex = { listing_id: string; title: string; last: string; at: string };

export function readIndex(): ChatIndex[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readScoped("chat_index");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
