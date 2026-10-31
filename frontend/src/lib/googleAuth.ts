/** Kept so a stale login chunk can still load after the old GIS path was removed. */
export function originBlocked(err: unknown) {
  const text = (err instanceof Error ? err.message : String(err || "")).toLowerCase();
  return /origin|redirect_uri|idpiframe|not allowed|old host|prompt_skipped/.test(text);
}

export function googleClosed() {
  return false;
}

export async function requestGoogleIdToken(): Promise<{ token: string; nonce: string }> {
  throw new Error("prompt_skipped");
}
