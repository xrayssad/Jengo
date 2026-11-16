import Link from "next/link";
import Brand from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="status-screen">
      <Brand variant="mark" size={64} />
      <h1 className="page-title">This page is not on Jengo</h1>
      <Link href="/home" className="btn-primary status-link">Back home</Link>
    </main>
  );
}
