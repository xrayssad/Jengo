import { allow, reverseServer } from "@/lib/geocodeServer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const lang = url.searchParams.get("lang") === "en" ? "en" : "sw";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: "bad coordinates" }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) return Response.json({ error: "slow down" }, { status: 429 });
  try {
    const row = await reverseServer(lat, lng, lang);
    return Response.json(row, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return Response.json({ label: "", names: [], city: "" }, { status: 502 });
  }
}
