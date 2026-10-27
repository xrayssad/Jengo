import { NextRequest } from "next/server";

const CLIENT_RE = /([A-Za-z0-9\-_.]+\.apps\.googleusercontent\.com)/;

export async function GET(request: NextRequest) {
  const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const target = request.nextUrl.searchParams.get("url") || "";
  const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let host = "";
  try {
    host = new URL(allowed).host;
  } catch {
    host = "";
  }
  if (!target || !host || !target.startsWith(`https://${host}/auth/v1/authorize`)) {
    return Response.json({ client_id: envId }, { status: envId ? 200 : 400 });
  }
  const res = await fetch(target, { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  let clientId = "";
  try {
    clientId = loc ? new URL(loc).searchParams.get("client_id") || "" : "";
  } catch {
    clientId = "";
  }
  if (!clientId) {
    const match = `${loc} ${await res.text()}`.match(CLIENT_RE);
    clientId = match?.[1] || "";
  }
  return Response.json({ client_id: clientId || envId });
}
