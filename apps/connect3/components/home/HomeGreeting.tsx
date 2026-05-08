"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { SearchInput } from "@/components/search/SearchInput";

function greeting(name: string | null) {
  const h = new Date().getHours();
  const time =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${time}, ${name}` : time;
}

export function HomeGreeting() {
  const { profile } = useAuthStore();
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-10 pb-2 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting(profile?.first_name ?? null)}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s coming up for you.
        </p>
      </div>

      {/* Search + Recently Viewed */}
      <div className="rounded-3xl bg-gradient-to-br from-[#ede4ff] to-[#d9c9ff] px-6 py-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 w-full">
          <h2 className="font-fredoka text-2xl md:text-3xl font-semibold text-[#5c2fa0] tracking-[0.01em] text-center">
            Discover more on campus
          </h2>
          <SearchInput className="w-full max-w-xl" onSubmit={handleSearch} />
        </div>

        {/* Recently Viewed */}
        <div className="w-fit mx-auto">
          <p className="text-xs font-semibold text-[#7c3aed]/60 tracking-widest uppercase mb-3">
            Recently Viewed
          </p>
          <div className="flex gap-3 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-36 rounded-2xl overflow-hidden bg-white/50 border border-white/60"
              >
                <div className="w-full h-24 bg-white/40 animate-pulse" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2.5 bg-white/60 rounded animate-pulse w-4/5" />
                  <div className="h-2.5 bg-white/60 rounded animate-pulse w-3/5" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#7c3aed]/50">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
