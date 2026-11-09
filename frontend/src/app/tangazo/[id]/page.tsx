"use client";

import { useParams } from "next/navigation";
import DetailsClient from "./DetailsClient";

export default function TangazoDetailsPage() {
  const params = useParams<{ id: string }>();
  return <DetailsClient id={String(params.id || "")} />;
}
