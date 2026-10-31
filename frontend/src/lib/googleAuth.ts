type GoogleIdCallback = { credential?: string };

type GooglePrompt = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void;
      prompt: (cb?: (notification: GooglePrompt) => void) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const MSG = "jengo-google";

function originHint() {
  const origin = window.location.origin;
  return `Google is still showing the old host. In Google Cloud, open the OAuth client used by Jengo and add ${origin} under Authorized JavaScript origins, and ${origin}/auth/google-popup under Authorized redirect URIs.`;
}

export function originBlocked(err: unknown) {
  const text = (err instanceof Error ? err.message : String(err || "")).toLowerCase();
  return /origin|redirect_uri|idpiframe|not allowed|old host/.test(text);
}

export function googleClosed(err: unknown) {
  const text = err instanceof Error ? err.message : String(err || "");
  return /sign-in was closed|was cancelled|was canceled|popup closed/i.test(text);
}

function loadGis(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const finish = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error("Google sign-in did not load"));
    };
    if (existing) {
      if (window.google?.accounts?.id) return finish();
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in did not load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("Google sign-in did not load"));
    document.head.appendChild(script);
  });
}

async function noncePair() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { nonce, hashed };
}

function gisCredential(clientId: string, hashedNonce: string): Promise<string> {
  return loadGis().then(
    (google) =>
      new Promise<string>((resolve, reject) => {
        let settled = false;
        const wait = window.setTimeout(() => finish(() => reject(new Error("prompt_skipped"))), 120000);
        const skip = window.setTimeout(() => finish(() => reject(new Error("prompt_skipped"))), 2500);
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(wait);
          window.clearTimeout(skip);
          fn();
        };
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          context: "signin",
          nonce: hashedNonce,
          itp_support: true,
          use_fedcm_for_prompt: true,
          auto_select: false,
          callback: (res: GoogleIdCallback) => {
            if (res.credential) finish(() => resolve(res.credential as string));
            else finish(() => reject(new Error("Google did not return a sign-in token")));
          },
        });
        google.accounts.id.prompt((notification) => {
          window.clearTimeout(skip);
          if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
            finish(() => reject(new Error(notification.getNotDisplayedReason?.() || "prompt_skipped")));
          }
        });
      }),
  );
}

function implicitCredential(clientId: string, hashed: string): Promise<string> {
  const redirectUri = `${window.location.origin}/auth/google-popup`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("nonce", hashed);
  url.searchParams.set("prompt", "select_account");

  return new Promise((resolve, reject) => {
    const popup = window.open(url.toString(), "jengo-google", "popup=yes,width=480,height=720");
    if (!popup) {
      window.location.assign(url.toString());
      return;
    }
    const onMsg = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== MSG) return;
      cleanup();
      if (event.data.error) reject(new Error(originBlocked(event.data.error) ? originHint() : String(event.data.error)));
      else if (event.data.credential) resolve(String(event.data.credential));
      else reject(new Error("Google did not return a sign-in token"));
    };
    const cleanup = () => {
      window.removeEventListener("message", onMsg);
      window.clearInterval(timer);
    };
    window.addEventListener("message", onMsg);
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Google sign-in was closed"));
      }
    }, 400);
  });
}

export async function requestGoogleIdToken(clientId: string): Promise<{ token: string; nonce: string }> {
  const { nonce, hashed } = await noncePair();
  try {
    const token = await gisCredential(clientId, hashed);
    return { token, nonce };
  } catch (err) {
    const why = err instanceof Error ? err.message : "";
    if (originBlocked(err)) {
      throw new Error(originHint());
    }
    try {
      const token = await implicitCredential(clientId, hashed);
      return { token, nonce };
    } catch (next) {
      if (googleClosed(next) && !originBlocked(err)) {
        throw next instanceof Error ? next : new Error("Google sign-in was closed");
      }
      if (originBlocked(next) || originBlocked(err)) {
        throw new Error(originHint());
      }
      throw next instanceof Error ? next : new Error(why || "Google sign-in did not finish");
    }
  }
}

export function readPopupToken() {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const query = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
  const params = new URLSearchParams(hash || query);
  return {
    credential: params.get("id_token") || "",
    error: params.get("error_description") || params.get("error") || "",
  };
}

export function postPopupToken(payload: { credential?: string; error?: string }) {
  if (window.opener) {
    window.opener.postMessage({ type: MSG, ...payload }, window.location.origin);
    window.close();
    return true;
  }
  return false;
}
