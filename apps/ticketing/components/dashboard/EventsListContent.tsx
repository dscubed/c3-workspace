"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@c3/auth";
import { useIntersection } from "@/lib/hooks/useIntersection";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarDays,
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDisplayCard } from "@/components/dashboard/EventDisplayCard";
import { formatDateTBA } from "@/components/shared/utils";
import type { EventCardDetails } from "@/lib/types/events";

type EventTab = "all" | "published" | "draft" | "requests";
const PAGE_SIZE = 20;

interface InviteEvent {
  id: string;
  name: string | null;
  start: string | null;
  status: string;
  event_images: { url: string; sort_order: number }[] | null;
}

interface InvitePerson {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface Invite {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  events: InviteEvent | null;
  inviter: InvitePerson | null;
  invitee: InvitePerson | null;
}

export interface EventsListContentProps {
  clubId: string;
  clubName?: string;
  headerAction?: React.ReactNode;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ── Request card ── */
function RequestCard({
  invite,
  direction,
  onAction,
}: {
  invite: Invite;
  direction: "incoming" | "outgoing";
  onAction: (id: string, action: "accept" | "decline" | "cancel") => void;
}) {
  const [busy, setBusy] = useState(false);
  const event = invite.events;
  const thumbnail =
    event?.event_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
    null;
  const primaryPerson =
    direction === "incoming" ? invite.inviter : invite.invitee;
  const senderPerson = direction === "outgoing" ? invite.inviter : null;

  const act = async (action: "accept" | "decline" | "cancel") => {
    setBusy(true);
    await onAction(invite.id, action);
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
      {/* Event thumbnail */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={event?.name ?? ""}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {event?.name ?? "Untitled Event"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTBA(event?.start ?? null)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {primaryPerson && (
            <>
              <Avatar className="h-4 w-4 shrink-0">
                {primaryPerson.avatar_url && (
                  <AvatarImage
                    src={primaryPerson.avatar_url}
                    alt={primaryPerson.first_name}
                  />
                )}
                <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                  {primaryPerson.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate">
                {direction === "incoming" ? "from" : "to"}{" "}
                <span className="font-medium text-foreground">
                  {primaryPerson.first_name} {primaryPerson.last_name ?? ""}
                </span>
              </p>
            </>
          )}
          {senderPerson && (
            <>
              <span className="text-muted-foreground/40 text-xs shrink-0">
                ·
              </span>
              <Avatar className="h-4 w-4 shrink-0">
                {senderPerson.avatar_url && (
                  <AvatarImage
                    src={senderPerson.avatar_url}
                    alt={senderPerson.first_name}
                  />
                )}
                <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                  {senderPerson.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate">
                sent by{" "}
                <span className="font-medium text-foreground">
                  {senderPerson.first_name} {senderPerson.last_name ?? ""}
                </span>
              </p>
            </>
          )}
          <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
          <p className="text-xs text-muted-foreground shrink-0">
            {timeAgo(invite.created_at)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {direction === "incoming" ? (
          <>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
              disabled={busy}
              onClick={() => act("accept")}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => act("decline")}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-muted-foreground"
            disabled={busy}
            onClick={() => act("cancel")}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function EventsListContent({
  clubId,
  clubName,
  headerAction,
}: EventsListContentProps) {
  const router = useRouter();
  const { user, isOrganisation } = useAuthStore();

  const { clubs } = useAdminClubSelector();
  const isOrg = user ? isOrganisation() : false;
  const isOwner = isOrg && user?.id === clubId;
  const isClubAdmin = clubs.some((c) => c.club_id === clubId);

  const [events, setEvents] = useState<EventCardDetails[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetchedOnce = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const [tab, setTab] = useState<EventTab>("all");

  /* ── Requests state ── */
  const [incoming, setIncoming] = useState<Invite[]>([]);
  const [outgoing, setOutgoing] = useState<Invite[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsTab, setRequestsTab] = useState<"incoming" | "outgoing">(
    "incoming",
  );

  /* ── Delete state ── */
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    eventId: string;
    eventName: string;
  }>({ open: false, eventId: "", eventName: "" });
  const [deleting, setDeleting] = useState(false);

  const { ref: sentinelRef, isIntersecting } = useIntersection({
    rootMargin: "200px",
  });

  /* ── Fetch events ── */
  const fetchPage = useCallback(
    async (cursor: string | null, replace: boolean) => {
      if (replace && !hasFetchedOnce.current) setInitialLoading(true);
      if (!replace) setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          club_id: clubId,
        });
        if (tab !== "all" && tab !== "requests") params.set("status", tab);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/events?${params}`);
        if (!res.ok) throw new Error("Failed to fetch events");

        const json = await res.json();
        const items: EventCardDetails[] = json.data ?? [];
        setHasMore(json.hasMore ?? false);
        cursorRef.current = json.nextCursor ?? null;

        if (replace) setEvents(items);
        else setEvents((prev) => [...prev, ...items]);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        hasFetchedOnce.current = true;
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [tab, clubId],
  );

  /* ── Fetch requests ── */
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        fetch("/api/invites?direction=incoming&status=pending"),
        fetch("/api/invites?direction=outgoing"),
      ]);
      const [inJson, outJson] = await Promise.all([
        inRes.json(),
        outRes.json(),
      ]);
      setIncoming(inJson.data ?? []);
      setOutgoing(outJson.data ?? []);
    } catch {
      /* silent */
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "requests") {
      fetchRequests();
      return;
    }
    hasFetchedOnce.current = false;
    cursorRef.current = null;
    setEvents([]);
    fetchPage(null, true);
  }, [tab, clubId, fetchPage, fetchRequests]);

  useEffect(() => {
    if (isIntersecting && hasMore && !loadingMore && !initialLoading) {
      fetchPage(cursorRef.current, false);
    }
  }, [isIntersecting, hasMore, loadingMore, initialLoading, fetchPage]);

  useEffect(() => {
    const onFocus = () => {
      if (tab === "requests") {
        fetchRequests();
        return;
      }
      cursorRef.current = null;
      fetchPage(null, true);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPage, fetchRequests, tab]);

  /* ── Remove self as collaborator ── */
  const handleRemoveSelf = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/hosts`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Removed from event");
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
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
        setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.eventId));
      } else {
        const err = await res.json();
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
          setOutgoing((prev) => prev.filter((i) => i.id !== id));
          toast.success("Invite cancelled");
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
          setIncoming((prev) => prev.filter((i) => i.id !== id));
          toast.success(
            action === "accept" ? "Invite accepted" : "Invite declined",
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
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as EventTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {incoming.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#854ECB] text-white text-[10px] font-medium">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {headerAction}
      </div>

      {/* Requests tab */}
      {tab === "requests" ? (
        <>
          <Tabs
            value={requestsTab}
            onValueChange={(v) => setRequestsTab(v as "incoming" | "outgoing")}
          >
            <TabsList>
              <TabsTrigger value="incoming">
                Incoming
                {incoming.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#854ECB] text-white text-[10px] font-medium">
                    {incoming.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                Outgoing
                {outgoing.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-gray-400 text-white text-[10px] font-medium">
                    {outgoing.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
      ) : initialLoading && !hasFetchedOnce.current ? (
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
