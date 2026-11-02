import { Suspense } from "react";
import JobClient from "./JobClient";

export const instant = false;

async function Body({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobClient id={id} />;
}

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }} />}>
      <Body params={params} />
    </Suspense>
  );
}
