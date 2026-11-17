import { ListingFeedSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="canvas px-4 pt-6" aria-busy="true" aria-label="Loading">
      <ListingFeedSkeleton count={3} layout="large" />
    </div>
  );
}
