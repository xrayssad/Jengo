import type { CSSProperties } from "react";

function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skel-bone ${className}`.trim()} style={style} />;
}

export function ListingCardSkeleton({ wide = false, layout = "grid" }: { wide?: boolean; layout?: "grid" | "list" }) {
  if (layout === "list" && !wide) {
    return (
      <div className="market-tile is-row" aria-hidden>
        <div className="listing-media">
          <div className="market-tile-media">
            <Bone className="absolute inset-0 rounded-none" />
          </div>
        </div>
        <div className="market-body space-y-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3 w-3/5" />
        </div>
      </div>
    );
  }

  if (wide) {
    return (
      <div className="estate-card" aria-hidden>
        <div className="relative estate-card-media">
          <Bone className="absolute inset-0 rounded-none" />
        </div>
        <div className="px-4 pt-3.5 pb-4 space-y-2">
          <Bone className="h-6 w-36" />
          <Bone className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="market-tile" aria-hidden>
      <div className="market-tile-media">
        <Bone className="absolute inset-0 rounded-none" />
      </div>
      <div className="market-body space-y-2">
        <Bone className="h-4 w-2/3" />
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-4/5" />
        <Bone className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ListingFeedSkeleton({ count = 4, wide = false, layout = "grid" }: { count?: number; wide?: boolean; layout?: "grid" | "list" }) {
  const list = layout === "list" && !wide;
  return (
    <div className={wide ? "space-y-5" : list ? "listing-grid is-list" : "listing-grid"} aria-busy="true" aria-label="Loading listings">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} wide={wide} layout={layout} />
      ))}
    </div>
  );
}

export function HomeFeedSkeleton() {
  return <ListingFeedSkeleton count={4} />;
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading listing">
      <div className="relative detail-hero overflow-hidden" style={{ height: "min(52vh, 420px)", minHeight: 280 }}>
        <Bone className="absolute inset-0 rounded-none" />
        <Bone className="absolute top-4 left-4 h-10 w-10 rounded-full" />
        <Bone className="absolute top-4 right-4 h-10 w-10 rounded-full" />
      </div>
      <div className="canvas-read px-5 pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Bone className="h-8 w-44" />
            <Bone className="h-4 w-56" />
          </div>
          <Bone className="h-8 w-24 rounded-full" />
        </div>
        <Bone className="h-5 w-52" />
        <div className="grid grid-cols-4 gap-2 pt-1">
          <Bone className="h-[72px] w-full rounded-[22px]" />
          <Bone className="h-[72px] w-full rounded-[22px]" />
          <Bone className="h-[72px] w-full rounded-[22px]" />
          <Bone className="h-[72px] w-full rounded-[22px]" />
        </div>
        <Bone className="h-4 w-40 mt-2" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4" style={{ width: "84%" }} />
        <Bone className="h-4" style={{ width: "66%" }} />
      </div>
    </div>
  );
}

export function ChatListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sheet block p-4 rounded-[24px]">
          <Bone className="h-3 w-24 mb-2" />
          <Bone className="h-5 w-48 mb-2" />
          <Bone className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex-1 canvas-read w-full px-5 py-4 space-y-3" aria-busy="true" aria-label="Loading chat">
      <div className="flex justify-start">
        <Bone className="h-10 w-44 rounded-[18px]" />
      </div>
      <div className="flex justify-end">
        <Bone className="h-10 w-36 rounded-[18px]" />
      </div>
      <div className="flex justify-start">
        <Bone className="h-16 w-52 rounded-[18px]" />
      </div>
      <div className="flex justify-end">
        <Bone className="h-10 w-28 rounded-[18px]" />
      </div>
      <div className="flex justify-start">
        <Bone className="h-10 w-40 rounded-[18px]" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="canvas-read px-5 py-6 space-y-5" aria-busy="true" aria-label="Loading profile">
      <div className="relative overflow-hidden rounded-[28px]" style={{ height: 168 }}>
        <Bone className="absolute inset-0 rounded-none" />
        <div className="absolute left-4 right-4 bottom-4 space-y-2">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-48" />
        </div>
      </div>
      <Bone className="h-12 w-full rounded-full" />
      <div className="sheet rounded-[28px] overflow-hidden p-2 space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Bone className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-44" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading search">
      <ListingFeedSkeleton count={4} />
    </div>
  );
}

/** Optional cream-page reel placeholder; reels/page keeps its dark local skeleton. */
export function ReelSkeleton() {
  return (
    <div className="estate-card overflow-hidden" style={{ height: 420 }} aria-busy="true" aria-label="Loading reel">
      <div className="relative h-full w-full">
        <Bone className="absolute inset-0 rounded-none" />
        <div className="absolute left-4 right-4 bottom-5 space-y-2">
          <Bone className="h-8 w-8 rounded-full" />
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-56" />
        </div>
      </div>
    </div>
  );
}

export function PaymentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading payments">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sheet rounded-[24px] space-y-2">
          <div className="flex justify-between gap-3">
            <Bone className="h-5 w-40" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <Bone className="h-4 w-28" />
          <Bone className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}
