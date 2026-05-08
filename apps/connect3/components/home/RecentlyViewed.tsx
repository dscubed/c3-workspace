"use client";

export function RecentlyViewed() {
  return (
    <section className="px-4 md:px-8 lg:px-12 py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recently Viewed
        </h2>
        <div className="flex gap-3 overflow-x-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-40 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm"
            >
              <div className="w-full h-28 bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Coming soon</p>
      </div>
    </section>
  );
}
