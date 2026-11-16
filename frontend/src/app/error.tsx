"use client";

import Brand from "@/components/Brand";

export default function ErrorScreen({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-screen">
      <Brand variant="mark" size={64} />
      <h1 className="page-title">Something went wrong</h1>
      <button type="button" className="btn-primary status-link" onClick={() => reset()}>Retry</button>
    </main>
  );
}
