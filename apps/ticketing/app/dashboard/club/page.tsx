"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@c3/auth";
import { useClubStore } from "@c3/auth";
import { AdminManagePanel } from "@/components/dashboard/AdminManagePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield, Users } from "lucide-react";

function ClubManagementSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </>
  );
}

function ClubManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isOrganisation } = useAuthStore();
  const isOrg = !authLoading && !!user && isOrganisation();

  const queryClubId = searchParams.get("club_id");
  const clubId = isOrg ? (user?.id ?? null) : queryClubId;

  const { clubs, clubsLoading } = useClubStore();
  const isVerified = isOrg || clubs.some((r) => r.club_id === queryClubId);

  if (authLoading || (!isOrg && clubsLoading))
    return <ClubManagementSkeleton />;

  if (!user || !clubId || (!isOrg && !isVerified)) {
    router.replace("/");
    return null;
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Club Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your club admins and members.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="admins">
        <TabsList className="mb-4">
          <TabsTrigger value="admins" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="members" disabled className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Members
            <Badge
              variant="outline"
              className="ml-1 text-[9px] px-1.5 py-0 leading-4"
            >
              Soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <AdminManagePanel clubId={clubId} />
        </TabsContent>

        <TabsContent value="members">
          {/* Placeholder — tab is disabled so this won't render */}
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">Coming soon</p>
            <p className="text-xs">
              Member management will be available in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function ClubManagementPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Suspense fallback={<ClubManagementSkeleton />}>
        <ClubManagementContent />
      </Suspense>
    </div>
  );
}
