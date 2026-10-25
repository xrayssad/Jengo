import { Suspense } from "react";
import ChatClient from "./ChatClient";

export const instant = false;

async function Body({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string; peer?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  return <ChatClient id={id} title={q.title || "Tangazo"} peer={q.peer} />;
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string; peer?: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />}>
      <Body params={params} searchParams={searchParams} />
    </Suspense>
  );
}
