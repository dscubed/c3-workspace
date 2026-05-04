"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, useClubStore } from "@c3/auth";
import { MediaTab, VALID_TABS } from "@/components/dashboard/media/types";
import { MediaTabContext } from "@/components/dashboard/media/MediaTabContext";
import { InstagramTabContent } from "@/components/dashboard/media/instagram/InstagramTabContent";
import { StorageTabContent } from "@/components/dashboard/media/storage/StorageTabContent";
import type { StorageCategory } from "@/lib/hooks/dashboard/media/useMediaStorage";

function MediaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const { activeClubId } = useClubStore();
  const effectiveClubId = isOrg ? (user?.id ?? null) : activeClubId;

  const rawTab = searchParams.get("tab") as MediaTab | null;
  const active = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "images";

  const changeTab = (tab: MediaTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <MediaTabContext.Provider value={{ active, changeTab }}>
      <div className="p-4 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Media</h1>
        </div>

        {active === "instagram" ? (
          <InstagramTabContent
            key="instagram"
            effectiveClubId={effectiveClubId}
          />
        ) : (
          <StorageTabContent key={active} active={active as StorageCategory} />
        )}
      </div>
    </MediaTabContext.Provider>
  );
}

export default function MediaPage() {
  return (
    <Suspense>
      <MediaPageContent />
    </Suspense>
  );
}
