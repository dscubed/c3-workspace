"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@c3/auth";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { AdminClubSelector } from "@/components/dashboard/AdminClubSelector";
import { MediaTab, VALID_TABS } from "@/components/dashboard/media/types";
import { InstagramTabContent } from "@/components/dashboard/media/instagram/InstagramTabContent";
import { StorageTabContent } from "@/components/dashboard/media/storage/StorageTabContent";

function MediaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const { clubs, selectedClubId, setSelectedClubId } = useAdminClubSelector();
  const effectiveClubId = isOrg ? (user?.id ?? null) : selectedClubId;

  const rawTab = searchParams.get("tab") as MediaTab | null;
  const active = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "images";

  const changeTab = (tab: MediaTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="p-4 sm:p-8 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Media</h1>
        {!isOrg && (
          <AdminClubSelector
            clubs={clubs}
            selectedClubId={selectedClubId}
            onSelect={setSelectedClubId}
          />
        )}
      </div>

      {active === "instagram" ? (
        <InstagramTabContent
          key="instagram"
          effectiveClubId={effectiveClubId}
          onChangeTab={changeTab}
        />
      ) : (
        <StorageTabContent
          key={active}
          active={active}
          onChangeTab={changeTab}
        />
      )}
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense>
      <MediaPageContent />
    </Suspense>
  );
}
