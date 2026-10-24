export type ChatMsg = { id: string; text: string; mine: boolean; at: string };

const key = (listingId: string) => `jengo_chat_${listingId}`;
const INDEX = "jengo_chat_index";

export function readChat(listingId: string): ChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(listingId));
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
  localStorage.setItem(key(listingId), JSON.stringify(all));
  const idx = readIndex().filter((x) => x.listing_id !== listingId);
  idx.unshift({ listing_id: listingId, title, last: text, at: msg.at });
  localStorage.setItem(INDEX, JSON.stringify(idx.slice(0, 50)));
  return all;
}

export type ChatIndex = { listing_id: string; title: string; last: string; at: string };

export function readIndex(): ChatIndex[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
