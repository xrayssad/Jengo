import { Suspense } from "react";
import DetailsClient from "./DetailsClient";

export const instant = false;
export const dynamic = "force-dynamic";

async function Body({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailsClient id={id} />;
}

export default function TangazoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "#FFF6ED" }} />}>
      <Body params={params} />
    </Suspense>
  );
}
