import { Skeleton } from "../skeleton";

export function EventDisplayCardSkeleton() {
  return (
    <div className="relative flex gap-4 w-full">
      {/* Thumbnail — matches EventDisplayCard's 112×112 */}
      <Skeleton
        className="shrink-0 rounded-xl"
        style={{ width: 112, height: 112 }}
      />

      {/* Text lines — mirrors the real card's content column */}
      <div className="flex flex-col justify-center gap-2 min-w-0 flex-1 pr-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
