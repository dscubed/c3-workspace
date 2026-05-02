"use client";

import { useCallback, useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { HostAvatarStack } from "../shared/HostAvatarStack";
import { CollaboratorSearchInput } from "./CollaboratorSearchInput";
import { CollaboratorList } from "./CollaboratorList";
import { StagedInvitesList } from "./StagedInvitesList";
import type { InviteRecord } from "./CollaboratorList";
import type { ClubProfile, HostsValue } from "../shared/types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

interface HostsDialogProps {
  /** The creator's own profile — always displayed, cannot be removed */
  creatorProfile: ClubProfile;
  /** Current hosts value (ids + data) — controls the display list */
  value: HostsValue;
  /** Callback when hosts list changes (for display purposes) */
  onChange: (value: HostsValue) => void;
  /** Event ID — required for fetching/sending invites */
  eventId?: string;
  /** Whether the event has been saved to DB yet */
  eventSaved: boolean;
  /** Callback after invites are sent (e.g. to trigger auto-save) */
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

  /* ── Search state ── */
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const fetchingRef = { current: false };

  /* ── Staged selections (local only until Confirm) ── */
  const [staged, setStaged] = useState<ClubProfile[]>([]);

  /* ── Existing invites ── */
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
      setClubs([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch clubs
  const fetchClubs = useCallback(
    async (pageNum: number, searchTerm: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          table: "profiles",
          select: "id,first_name,avatar_url",
          filter: JSON.stringify({ account_type: "organisation" }),
          limit: String(PAGE_SIZE),
          offset: String(pageNum * PAGE_SIZE),
        });
        if (searchTerm) params.set("search", searchTerm);

        const res = await fetch(`/api/profiles/fetch?${params}`);
        if (!res.ok) return;
        const { data } = await res.json();
        const results = (data ?? []) as ClubProfile[];

        if (pageNum === 0) {
          setClubs(results);
        } else {
          setClubs((prev) => {
            const ids = new Set(prev.map((c) => c.id));
            return [...prev, ...results.filter((c) => !ids.has(c.id))];
          });
        }
        setHasMore(results.length === PAGE_SIZE);
      } catch (err) {
        console.error("Failed to fetch clubs:", err);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Fetch existing invites
  const fetchInvites = useCallback(async () => {
    if (!eventId || !eventSaved) return;
    setInvitesLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`);
      if (res.ok) {
        const { data } = await res.json();
        setInvites(data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    } finally {
      setInvitesLoading(false);
    }
  }, [eventId, eventSaved]);

  useEffect(() => {
    if (open) fetchClubs(page, debouncedSearch);
  }, [open, page, debouncedSearch, fetchClubs]);

  useEffect(() => {
    if (open) {
      fetchInvites();
      setStaged([]);
    }
  }, [open, fetchInvites]);

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
        setInvites((prev) => prev.filter((i) => i.invitee_id !== profileId));
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
        setInvites((prev) => prev.filter((i) => i.invitee_id !== profileId));
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
        setInvites((prev) =>
          prev.map((i) =>
            i.invitee_id === profileId ? { ...i, status: "pending" } : i,
          ),
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

  /* ── Trigger label ── */
  const othersCount = selectedHostsData.length;
  const displayLabel =
    othersCount > 0
      ? `${creatorProfile.first_name} + ${othersCount} other${othersCount > 1 ? "s" : ""}`
      : creatorProfile.first_name;

  return (
    <>
      {/* Trigger — avatar stack + label + add button */}
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

      {/* Modal */}
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Manage Collaborators"
        description="Invite clubs to collaborate on this event. They'll be able to edit the event after accepting."
        className="sm:w-auto sm:max-w-[calc(100%-2rem)]"
      >
        {/*
          Layout: search (shrink-0, overflow-visible for dropdown) →
                  scrollable list (max-h capped) →
                  footer (shrink-0)
        */}
        <div className="flex flex-col gap-3">
          {/* Search + floating dropdown — z-10 so dropdown overlays list */}
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
              onScrollEnd={() => {
                if (hasMore && !loading) setPage((p) => p + 1);
              }}
            />
          </div>

          {/* Scrollable body */}
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

          {/* Footer */}
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
