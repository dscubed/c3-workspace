"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { HostAvatarStack } from "../../shared/HostAvatarStack";
import { CollaboratorSearchInput } from "./CollaboratorSearchInput";
import { CollaboratorList } from "./CollaboratorList";
import { StagedInvitesList } from "./StagedInvitesList";
import type { InviteRecord } from "./CollaboratorList";
import type { ClubProfile, HostsValue } from "../../shared/types";
import { fetcher } from "@/lib/fetcher";
import { useClubSearch } from "@/lib/hooks/useClubSearch";
import { toast } from "sonner";

interface HostsDialogProps {
  creatorProfile: ClubProfile;
  value: HostsValue;
  onChange: (value: HostsValue) => void;
  eventId?: string;
  eventSaved: boolean;
  onInvitesSent?: () => void;
}

export function HostsDialog({
  creatorProfile,
  value,
  onChange,
  eventId,
  eventSaved,
  onInvitesSent,
}: HostsDialogProps) {
  const { ids: selectedHosts, data: selectedHostsData } = value;
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [staged, setStaged] = useState<ClubProfile[]>([]);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ── Club search ── */
  const {
    search,
    setSearch,
    clubs,
    loading,
    onScrollEnd,
    reset: resetSearch,
  } = useClubSearch(open);

  /* ── Invites via SWR ── */
  const invitesKey =
    open && eventId && eventSaved ? `/api/events/${eventId}/invites` : null;
  const {
    data: invitesResponse,
    isLoading: invitesLoading,
    mutate: mutateInvites,
  } = useSWR(invitesKey, fetcher<{ data: InviteRecord[] }>);
  const invites = invitesResponse?.data ?? [];

  useEffect(() => {
    if (open) setStaged([]);
  }, [open]);

  /* ── Derived sets ── */
  const alreadyInvitedIds = new Set(invites.map((i) => i.invitee_id));
  const stagedIds = new Set(staged.map((c) => c.id));

  const toggleStaged = (club: ClubProfile) => {
    if (club.id === creatorProfile.id) return;
    if (alreadyInvitedIds.has(club.id)) return;
    setStaged((prev) => {
      const exists = prev.some((c) => c.id === club.id);
      return exists ? prev.filter((c) => c.id !== club.id) : [...prev, club];
    });
  };

  const toggleHost = (club: ClubProfile) => {
    if (club.id === creatorProfile.id) return;
    const isSelected = selectedHosts.includes(club.id);
    if (isSelected) {
      onChange({
        ids: selectedHosts.filter((id) => id !== club.id),
        data: selectedHostsData.filter((c) => c.id !== club.id),
      });
    } else {
      onChange({
        ids: [...selectedHosts, club.id],
        data: [...selectedHostsData, club],
      });
    }
  };

  /* ── Confirm & send invites ── */
  const handleConfirm = async () => {
    const newHostIds = staged
      .filter((c) => !selectedHosts.includes(c.id))
      .map((c) => c.id);
    const newHostData = staged.filter((c) => !selectedHosts.includes(c.id));

    if (newHostIds.length > 0) {
      onChange({
        ids: [...selectedHosts, ...newHostIds],
        data: [...selectedHostsData, ...newHostData],
      });
    }

    if (eventId && eventSaved && staged.length > 0) {
      setSending(true);
      try {
        const res = await fetch(`/api/events/${eventId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitee_ids: staged.map((c) => c.id) }),
        });
        if (res.ok) {
          const { data } = await res.json();
          toast.success(
            `Sent ${data.sent} invite${data.sent !== 1 ? "s" : ""}`,
          );
          onInvitesSent?.();
          mutateInvites();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to send invites");
        }
      } catch (err) {
        console.error("Failed to send invites:", err);
        toast.error("Failed to send invites");
      } finally {
        setSending(false);
      }
    } else if (staged.length > 0 && !eventSaved) {
      toast.info("Save the event first to send collaboration invites.");
    }

    setOpen(false);
  };

  const getInviteStatus = (profileId: string) =>
    invites.find((i) => i.invitee_id === profileId)?.status;

  /* ── Invite actions ── */
  const handleCancelInvite = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        mutateInvites(
          (prev) =>
            prev
              ? {
                  ...prev,
                  data: prev.data.filter((i) => i.invitee_id !== profileId),
                }
              : prev,
          { revalidate: false },
        );
        toast.success("Invite cancelled");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel invite");
      }
    } catch {
      toast.error("Failed to cancel invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCollaborator = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        mutateInvites(
          (prev) =>
            prev
              ? {
                  ...prev,
                  data: prev.data.filter((i) => i.invitee_id !== profileId),
                }
              : prev,
          { revalidate: false },
        );
        onChange({
          ids: selectedHosts.filter((id) => id !== profileId),
          data: selectedHostsData.filter((c) => c.id !== profileId),
        });
        toast.success("Collaborator removed");
        onInvitesSent?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove collaborator");
      }
    } catch {
      toast.error("Failed to remove collaborator");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvite = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        mutateInvites(
          (prev) =>
            prev
              ? {
                  ...prev,
                  data: prev.data.map((i) =>
                    i.invitee_id === profileId
                      ? { ...i, status: "pending" }
                      : i,
                  ),
                }
              : prev,
          { revalidate: false },
        );
        toast.success("Invite resent");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to resend invite");
      }
    } catch {
      toast.error("Failed to resend invite");
    } finally {
      setActionLoading(null);
    }
  };

  const othersCount = selectedHostsData.length;
  const displayLabel =
    othersCount > 0
      ? `${creatorProfile.first_name} + ${othersCount} other${othersCount > 1 ? "s" : ""}`
      : creatorProfile.first_name;

  return (
    <>
      <div className="flex items-center gap-2">
        <HostAvatarStack creator={creatorProfile} hosts={selectedHostsData} />
        <span className="max-w-45 truncate text-sm font-medium text-foreground sm:max-w-none">
          {displayLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      <ResponsiveModal
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetSearch();
        }}
        title="Manage Collaborators"
        description="Invite clubs to collaborate on this event. They'll be able to edit the event after accepting."
        className="sm:w-auto sm:max-w-[calc(100%-2rem)]"
      >
        <div className="flex flex-col gap-3">
          <div className="relative z-10 shrink-0">
            <CollaboratorSearchInput
              search={search}
              onSearchChange={(v) => setSearch(v)}
              searchFocused={searchFocused}
              onFocusChange={setSearchFocused}
              clubs={clubs}
              loading={loading}
              creatorProfile={creatorProfile}
              stagedIds={stagedIds}
              selectedHosts={selectedHosts}
              selectedHostsData={selectedHostsData}
              getInviteStatus={getInviteStatus}
              toggleStaged={toggleStaged}
              toggleHost={toggleHost}
              onScrollEnd={onScrollEnd}
            />
          </div>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-0.5">
            <CollaboratorList
              creatorProfile={creatorProfile}
              invites={invites}
              invitesLoading={invitesLoading}
              actionLoading={actionLoading}
              onCancelInvite={handleCancelInvite}
              onRemoveCollaborator={handleRemoveCollaborator}
              onResendInvite={handleResendInvite}
            />

            {staged.length > 0 && (
              <>
                <Separator />
                <StagedInvitesList
                  staged={staged}
                  onRemove={(club) => toggleStaged(club)}
                />
              </>
            )}
          </div>

          <Separator />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleConfirm}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {staged.length > 0
                ? `Confirm & Invite (${staged.length})`
                : "Done"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
