"use client";

import { useAuthStore } from "@c3/auth";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { AdminsTable } from "@/components/dashboard/AdminsTable";
import { ClubSelector } from "@/components/dashboard/ClubSelector";
import { Loader2, Building2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
 * OrgDashboard — shown to organisation accounts.
 * Their own profile IS the club, so clubId = user.id.
 * ────────────────────────────────────────────────────────────────*/
export function OrgDashboard() {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Club Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your club&apos;s admins and members.
        </p>
      </div>
      <AdminsTable clubId={user.id} />
      <MembersSection />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * UserDashboard — shown to regular users who are club admins.
 * Lets them pick a club then shows the same view.
 * ────────────────────────────────────────────────────────────────*/
export function UserDashboard() {
  const { user } = useAuthStore();
  const { clubs, loading, selectedClubId, setSelectedClubId } =
    useAdminClubSelector();

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No clubs</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You need to be invited as a club admin to manage clubs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Club Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admins and members for your clubs.
          </p>
        </div>
        {clubs.length > 1 && (
          <ClubSelector
            clubs={clubs}
            selectedClubId={selectedClubId}
            onSelect={setSelectedClubId}
          />
        )}
      </div>

      {selectedClubId && (
        <>
          <AdminsTable clubId={selectedClubId} />
          <MembersSection />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * MembersSection — placeholder until members feature ships.
 * ────────────────────────────────────────────────────────────────*/
function MembersSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Club Members</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <div className="rounded-lg border border-dashed py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Member management will be available in a future update.
        </p>
      </div>
    </div>
  );
}
