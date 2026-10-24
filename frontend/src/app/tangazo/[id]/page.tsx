import DetailsClient from "./DetailsClient";

export default async function TangazoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailsClient id={id} />;
}
