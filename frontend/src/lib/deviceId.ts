const KEY = "jengo_device";

/** Anonymous device id. Never required for browsing. Storage failures stay silent. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const cur = localStorage.getItem(KEY);
    if (cur && cur.length >= 8 && cur.length <= 80) return cur;
    const next = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    localStorage.setItem(KEY, next);
    return next;
  } catch {
    return "";
  }
}
