"use client";

import { use, useState } from "react";
import { ArrowLeft, Download, X, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, fetcher } from "@c3/utils";
import { useClubStore } from "@c3/auth";
import type { EventCardDetails } from "@c3/types";
import useSWR from "swr";
import { useEventRegistrations } from "@/lib/hooks/useEventRegistrations";

const statusColors: Record<string, string> = {
  live: "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  past: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { activeClubId } = useClubStore();
  const [showScreen, setShowScreen] = useState(false);

  const { data: events, isLoading } = useSWR<EventCardDetails[]>(
    activeClubId ? `/api/events?club_id=${activeClubId}` : null,
    fetcher,
  );

  const showSkeleton = !activeClubId || isLoading;
  const event = events?.find((e) => e.id === id) ?? null;

  const { registrations, isLoading: regLoading } = useEventRegistrations(id);
  const checkedInCount = registrations.filter((r) => r.checked_in).length;

  if (showSkeleton) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push("/dashboard/events")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </button>
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard/events")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge className={cn(statusColors[event.status])}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {event.start ? new Date(event.start).toLocaleDateString() : "TBA"}{" "}
            &bull; {event.location_name || "TBA"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Total Registrations</p>
            <p className="text-3xl font-bold mt-1">
              {regLoading ? "—" : registrations.length}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Checked In</p>
            <p className="text-3xl font-bold mt-1">
              {regLoading ? "—" : checkedInCount}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Check-in Rate</p>
            <p className="text-3xl font-bold mt-1">
              {regLoading || registrations.length === 0
                ? "—"
                : `${Math.round((checkedInCount / registrations.length) * 100)}%`}
            </p>
          </div>
        </div>

        {/* Attendee list */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">Attendees</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* TODO: CSV export */
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          {regLoading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No registrations yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Email
                    </th>
                    {registrations[0] &&
                      Object.keys(registrations[0].custom_fields ?? {}).map(
                        (key) => (
                          <th
                            key={key}
                            className="text-left px-4 py-3 font-medium text-muted-foreground"
                          >
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </th>
                        ),
                      )}
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((attendee) => (
                    <tr
                      key={attendee.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {attendee.first_name} {attendee.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {attendee.email}
                      </td>
                      {Object.values(attendee.custom_fields ?? {}).map(
                        (val, i) => (
                          <td
                            key={i}
                            className="px-4 py-3 text-muted-foreground"
                          >
                            {String(val)}
                          </td>
                        ),
                      )}
                      <td className="px-4 py-3">
                        {attendee.checked_in ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Checked In
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                            Not Checked In
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!attendee.checked_in && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              /* TODO: check-in route */
                            }}
                          >
                            <UserCheck className="size-3.5" />
                            Check In
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Event screen button */}
        <div>
          <Button onClick={() => setShowScreen(true)}>Event Screen</Button>
        </div>
      </div>

      {/* Fullscreen event screen overlay */}
      {showScreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300"
            onClick={() => setShowScreen(false)}
          >
            <X className="size-8" />
          </button>
          <h2 className="text-white text-3xl font-bold mb-8">{event.name}</h2>
          <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-8">
            <span className="text-gray-400 text-sm">QR Code</span>
          </div>
          <p className="text-white text-2xl font-semibold">
            {checkedInCount} / {mockAttendees.length} checked in
          </p>
        </div>
      )}
    </>
  );
}
