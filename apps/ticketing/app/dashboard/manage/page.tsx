"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useClubStore } from "@c3/auth";
import { OrgDashboardContent } from "@/components/dashboard/OrgDashboard";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ManageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ManageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { clubs, clubsLoading, activeClubId } = useClubStore();

  /* ── Modal ── */
  const [createModalOpen, setCreateModalOpen] = useState(false);

  /* Redirect unauthenticated */
  if (!authLoading && !user) {
    router.replace("/");
    return null;
  }

  /* Loading */
  if (clubsLoading) {
    return <ManageSkeleton />;
  }

  /* No clubs */
  if (!clubsLoading && clubs.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">
                You&apos;re not an admin of any clubs
              </p>
              <p className="text-sm text-muted-foreground">
                You need to be invited as a club admin to manage clubs.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Clubs</h1>
          <p className="text-muted-foreground">
            View admins, members, and events for your clubs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeClubId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                router.push(`/dashboard/club?club_id=${activeClubId}`)
              }
            >
              <Settings className="h-3.5 w-3.5" />
              Manage
            </Button>
          )}
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        clubId={activeClubId || undefined}
      />

      {/* ── Dashboard content (admins + events) ── */}
      {activeClubId && (
        <OrgDashboardContent
          clubId={activeClubId}
          notificationMode="user"
          eventsHref={`/dashboard/events?club_id=${activeClubId}`}
          clubHref={`/dashboard/club?club_id=${activeClubId}`}
        />
      )}
    </div>
  );
}

export default function DashboardManagePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Suspense fallback={<ManageSkeleton />}>
        <ManageContent />
      </Suspense>
    </div>
  );
}
