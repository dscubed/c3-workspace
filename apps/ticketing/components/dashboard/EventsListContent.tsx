"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useAuthStore, useClubStore } from "@c3/auth";
import { useIntersection } from "@/lib/hooks/useIntersection";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDisplayCard } from "@c3/ui/components/events/EventDisplayCard";
import type { EventCardDetails } from "@c3/types";
import { Invite, RequestCard } from "./event/RequestCard";

type EventTab = "all" | "published" | "draft" | "requests";
const PAGE_SIZE = 20;

export interface EventsListContentProps {
  clubId: string;
  clubName?: string;
  headerAction?: React.ReactNode;
}

export function EventsListContent({
  clubId,
  clubName,
  headerAction,
}: EventsListContentProps) {
  const router = useRouter();
  const { user, isOrganisation } = useAuthStore();

  const { clubs } = useClubStore();
  const isOrg = user ? isOrganisation() : false;
  const isOwner = isOrg && user?.id === clubId;
  const isClubAdmin = clubs.some((c) => c.club_id === clubId);

  const [tab, setTab] = useState<EventTab>("all");
  const [requestsTab, setRequestsTab] = useState<"incoming" | "outgoing">(
    "incoming",
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    eventId: string;
    eventName: string;
  }>({ open: false, eventId: "", eventName: "" });
  const [deleting, setDeleting] = useState(false);

  const { ref: sentinelRef, isIntersecting } = useIntersection({
    rootMargin: "200px",
  });

  /* ── Events (infinite scroll, cursor-based) ── */
  const {
    data: eventsPages,
    isLoading: initialLoading,
    isValidating,
    size,
    setSize,
    mutate: mutateEvents,
  } = useSWRInfinite<{
    data: EventCardDetails[];
    hasMore: boolean;
    nextCursor: string | null;
  }>(
    (pageIndex, prevData) => {
      if (tab === "requests") return null;
      if (prevData && !prevData.hasMore) return null;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        club_id: clubId,
      });
      if (tab !== "all") params.set("status", tab);
      if (pageIndex > 0 && prevData?.nextCursor)
        params.set("cursor", prevData.nextCursor);
      return `/api/events?${params}`;
    },
    fetcher,
    { revalidateOnFocus: true, revalidateFirstPage: false },
  );

  // Reset to page 1 when tab or clubId changes
  useEffect(() => {
    setSize(1);
  }, [tab, clubId, setSize]);

  const events: EventCardDetails[] = useMemo(
    () => eventsPages?.flatMap((p) => p.data ?? []) ?? [],
    [eventsPages],
  );
  const lastPage = eventsPages?.[eventsPages.length - 1];
  const hasMore = lastPage?.hasMore ?? false;
  const hasFetchedOnce = eventsPages !== undefined;
  const loadingMore =
    isValidating && !initialLoading && size > (eventsPages?.length ?? 0);

  // Trigger next page on intersection
  useEffect(() => {
    if (isIntersecting && hasMore && !isValidating) {
      setSize((s) => s + 1);
    }
  }, [isIntersecting, hasMore, isValidating, setSize]);

  /* ── Requests (SWR, only fetched when tab === "requests") ── */
  const {
    data: incomingData,
    isLoading: incomingLoading,
    mutate: mutateIncoming,
  } = useSWR<{ data: Invite[] }>(
    tab === "requests"
      ? "/api/invites?direction=incoming&status=pending"
      : null,
    fetcher,
  );
  const {
    data: outgoingData,
    isLoading: outgoingLoading,
    mutate: mutateOutgoing,
  } = useSWR<{ data: Invite[] }>(
    tab === "requests" ? "/api/invites?direction=outgoing" : null,
    fetcher,
  );
  const incoming: Invite[] = incomingData?.data ?? [];
  const outgoing: Invite[] = outgoingData?.data ?? [];
  const requestsLoading = incomingLoading || outgoingLoading;

  /* ── Remove self as collaborator ── */
  const handleRemoveSelf = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/hosts`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Removed from event");
        await mutateEvents(
          (pages) =>
            pages?.map((p) => ({
              ...p,
              data: p.data.filter((e) => e.id !== eventId),
            })),
          false,
        );
      } else {
        toast.error("Failed to remove");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  /* ── Delete event ── */
  const handleDeleteEvent = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteConfirm.eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Event deleted");
        await mutateEvents(
          (pages) =>
            pages?.map((p) => ({
              ...p,
              data: p.data.filter((e) => e.id !== deleteConfirm.eventId),
            })),
          false,
        );
      } else {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error || "Failed to delete event");
      }
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, eventId: "", eventName: "" });
    }
  };

  /* ── Handle invite action ── */
  const handleInviteAction = async (
    id: string,
    action: "accept" | "decline" | "cancel",
  ) => {
    try {
      if (action === "cancel") {
        const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Invite cancelled");
          await mutateOutgoing(
            (prev) => ({ data: (prev?.data ?? []).filter((i) => i.id !== id) }),
            false,
          );
        } else {
          toast.error("Failed to cancel invite");
        }
      } else {
        const res = await fetch(`/api/invites/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          toast.success(
            action === "accept" ? "Invite accepted" : "Invite declined",
          );
          await mutateIncoming(
            (prev) => ({ data: (prev?.data ?? []).filter((i) => i.id !== id) }),
            false,
          );
        } else {
          toast.error("Failed to update invite");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const emptyLabel = useMemo(() => {
    if (tab === "published") return "No published events yet";
    if (tab === "draft") return "No drafts yet";
    return "No events yet";
  }, [tab]);

  const emptySubLabel = clubName
    ? `Create an event for ${clubName} to get started.`
    : "Create an event to get started.";

  const canDeleteEvent = (eventHostId: string) => {
    if (!user) return false;
    if (eventHostId === user.id) return true;
    if (isOwner && eventHostId === clubId) return true;
    if (isClubAdmin && eventHostId === clubId) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {(["all", "published", "draft", "requests"] as EventTab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 inline-flex items-center gap-1",
                  tab === t
                    ? "bg-[#854ECB] text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-black",
                )}
              >
                {t === "all" && "All"}
                {t === "published" && "Published"}
                {t === "draft" && "Drafts"}
                {t === "requests" && (
                  <>
                    Requests
                    {incoming.length > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-medium">
                        {incoming.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ),
          )}
        </div>
        {headerAction}
      </div>

      {/* Requests tab */}
      {tab === "requests" ? (
        <>
          <div className="flex items-center gap-2">
            {(["incoming", "outgoing"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRequestsTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 inline-flex items-center gap-1",
                  requestsTab === t
                    ? "bg-[#854ECB] text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-black",
                )}
              >
                {t === "incoming" ? (
                  <>
                    Incoming
                    {incoming.length > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-medium">
                        {incoming.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Outgoing
                    {outgoing.length > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-medium">
                        {outgoing.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200"
                >
                  <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          ) : requestsTab === "incoming" ? (
            incoming.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium">No incoming requests</p>
                    <p className="text-sm text-muted-foreground">
                      When someone invites you to collaborate on an event,
                      it&apos;ll show up here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {incoming.map((inv) => (
                  <RequestCard
                    key={inv.id}
                    invite={inv}
                    direction="incoming"
                    onAction={handleInviteAction}
                  />
                ))}
              </div>
            )
          ) : outgoing.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No outgoing requests</p>
                  <p className="text-sm text-muted-foreground">
                    Invites you&apos;ve sent to collaborators appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {outgoing.map((inv) => (
                <RequestCard
                  key={inv.id}
                  invite={inv}
                  direction="outgoing"
                  onAction={handleInviteAction}
                />
              ))}
            </div>
          )}
        </>
      ) : initialLoading && !hasFetchedOnce ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-27.5 h-27.5 rounded-xl shrink-0" />
              <div className="flex flex-col justify-center gap-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">{emptyLabel}</p>
              <p className="text-sm text-muted-foreground">{emptySubLabel}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {events.map((event) => (
              <EventDisplayCard
                key={event.id}
                event={event}
                menu={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-36 rounded-xl border border-gray-200 bg-white p-1"
                    >
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm"
                        onClick={() => router.push(`/events/${event.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      {canDeleteEvent(event.host.id) ? (
                        <DropdownMenuItem
                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm text-destructive focus:text-destructive"
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              eventId: event.id,
                              eventName: event.name || "Untitled Event",
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm text-destructive focus:text-destructive"
                          onClick={() => handleRemoveSelf(event.id)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
                onClick={() => router.push(`/events/${event.id}/edit`)}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-4">
            {loadingMore && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open)
            setDeleteConfirm({ open: false, eventId: "", eventName: "" });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirm.eventName}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
