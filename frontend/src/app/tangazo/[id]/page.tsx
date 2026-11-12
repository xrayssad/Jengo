import { Suspense } from "react";
import { DetailSkeleton } from "@/components/Skeletons";
import DetailsClient from "./DetailsClient";

export const instant = false;

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
    <Suspense fallback={<DetailSkeleton />}>
      <Body params={params} />
    </Suspense>
  );
}
