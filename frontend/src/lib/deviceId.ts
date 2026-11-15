const KEY = "jengo_device";

let memoryId = "";

function mint(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2, 10)}`;
}

function usable(value: string | null): value is string {
  return Boolean(value && value.length >= 8 && value.length <= 80);
}

/** Stable anonymous id. localStorage survives reloads; session storage is the fallback. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const cur = localStorage.getItem(KEY);
    if (usable(cur)) return cur;
    const next = mint();
    localStorage.setItem(KEY, next);
    return next;
  } catch {
    /* private mode */
  }
  try {
    const cur = sessionStorage.getItem(KEY);
    if (usable(cur)) return cur;
    const next = memoryId || mint();
    memoryId = next;
    sessionStorage.setItem(KEY, next);
    return next;
  } catch {
    if (!memoryId) memoryId = mint();
    return memoryId;
  }
}
