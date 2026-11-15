import { apiSend } from "@/lib/api";

export type VerifiedType = "individual" | "business" | null;

export type EligibilityItem = {
  id: string;
  ok: boolean;
  href?: string;
};

export type Eligibility = {
  eligible: boolean;
  items: EligibilityItem[];
  min_days?: number;
};

export type VerificationState = {
  is_verified: boolean;
  verified_type: VerifiedType;
  request: {
    id?: string | null;
    status?: string | null;
    type?: string | null;
    reason_code?: string | null;
    revoked_reason?: string | null;
    submitted_at?: string | null;
    decided_at?: string | null;
    retry_at?: string | null;
    is_verified?: boolean;
    verified_type?: VerifiedType;
  } | null;
};

export type SignedUpload = {
  key: string;
  signed_url: string;
  token?: string;
};

export async function fetchEligibility() {
  return apiSend<Eligibility>("/verification/eligibility");
}

export async function fetchVerificationMe() {
  return apiSend<VerificationState>("/verification/requests/me");
}

export async function patchVerificationProfile(body: { full_name?: string; phone?: string }) {
  return apiSend<Eligibility>("/verification/profile", { method: "POST", body: JSON.stringify(body) });
}

export async function uploadAvatar(file: Blob) {
  const body = new FormData();
  body.set("file", file, "avatar.jpg");
  const headers: Record<string, string> = {};
  return apiSend<Eligibility & { avatar_url?: string }>("/verification/avatar", { method: "POST", body, headers });
}

export async function signSlots(slots: string[]) {
  return apiSend<{ uploads: Record<string, SignedUpload>; expires_in: number }>("/verification/uploads", {
    method: "POST",
    body: JSON.stringify({ slots }),
  });
}

export function putSigned(url: string, file: Blob, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / Math.max(event.total, 1));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload")));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export async function uploadPrivate(slot: string, file: Blob, onProgress: (value: number) => void) {
  const body = new FormData();
  body.set("file", file, `${slot}.jpg`);
  return new Promise<{ key: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || "https://jengo-qkq1.onrender.com"}/verification/uploads/file?slot=${encodeURIComponent(slot)}`);
    const token = localStorage.getItem("jengo_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    try {
      const device = localStorage.getItem("jengo_device");
      if (device) xhr.setRequestHeader("X-Device-Id", device);
    } catch {
      /* ignore */
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / Math.max(event.total, 1));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}") as { key?: string; detail?: string };
        if (xhr.status >= 200 && xhr.status < 300 && data.key) resolve({ key: data.key });
        else reject(new Error(data.detail || "upload"));
      } catch {
        reject(new Error("upload"));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

export async function submitVerification(body: Record<string, unknown>) {
  return apiSend<VerificationState["request"]>("/verification/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type QueueItem = {
  id: string;
  user_id: string;
  type: string;
  legal_name: string;
  doc_type: string;
  status: string;
  reason_code?: string | null;
  flagged?: boolean;
  submitted_at?: string;
};

export async function fetchVerificationQueue(status = "pending") {
  return apiSend<{ items: QueueItem[] }>(`/admin/verification/queue?status=${encodeURIComponent(status)}`);
}

export type ReviewDetail = {
  request: QueueItem & { reviewer_note?: string | null };
  photos: Record<string, string | null>;
  expires_in: number;
  profile_name?: string | null;
  profile_username?: string | null;
  name_match: boolean;
  is_verified: boolean;
  verified_type: VerifiedType;
  audit: { id: string; actor_id?: string; action: string; reason_code?: string | null; note?: string | null; created_at?: string }[];
  reviewer_id: string;
};

export async function fetchVerificationDetail(id: string) {
  return apiSend<ReviewDetail>(`/admin/verification/${id}`);
}

export async function decideVerification(id: string, body: { action: "approve" | "reject"; reason_code?: string; note: string }) {
  return apiSend(`/admin/verification/${id}/decision`, { method: "POST", body: JSON.stringify(body) });
}

export async function grantBadge(userId: string, body: { note: string; verified_type: "individual" | "business" }) {
  return apiSend(`/admin/users/${userId}/grant-badge`, { method: "POST", body: JSON.stringify(body) });
}

export async function revokeBadge(userId: string, body: { note: string; reason: string }) {
  return apiSend(`/admin/users/${userId}/revoke-badge`, { method: "POST", body: JSON.stringify(body) });
}
