"use client";

import { useState } from "react";
import Image from "next/image";
import { useClubStore } from "@c3/auth";
import { Plus, CalendarDays, MapPin, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@c3/ui";
import type { EventCardDetailsWithStats } from "@c3/types";
import { fetcher } from "@c3/utils";
import useSWR from "swr";

type FilterType = "all" | "upcoming" | "past" | "draft" | "live";

function relativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  if (diffDays < 7) return `in ${diffDays}d`;
  if (diffDays < 30) return `in ${Math.round(diffDays / 7)}w`;
  return `in ${Math.round(diffDays / 30)}mo`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  switch (status) {
    case "live":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      );
    case "upcoming":
      return (
        <span className="inline-flex items-center text-xs font-semibold text-[#854ECB] bg-[#F9ECFF] px-2.5 py-1 rounded-full">
          Upcoming
        </span>
      );
    case "past":
      return (
        <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          Past
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
          Draft
        </span>
      );
    default:
      return null;
  }
}

function EventRowSkeleton() {
  return (
    <div className="flex gap-5 p-5 animate-pulse">
      <div className="shrink-0 w-44 h-44 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="shrink-0 w-20 h-8 rounded-lg bg-gray-200 self-center" />
    </div>
  );
}

function EventRow({
  event,
  onClick,
}: {
  event: EventCardDetailsWithStats;
  onClick: () => void;
}) {
  const isLive = event.status === "live";
  const rel = isLive ? "Now" : relativeTime(event.start || "");
  const initial = event.name?.charAt(0).toUpperCase() || "?";

  return (
    <li
      className="flex items-center gap-5 px-5 py-4 hover:bg-gray-50/70 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-44 rounded-xl overflow-hidden bg-purple-100 flex items-center justify-center aspect-square">
        {event.thumbnail ? (
          <Image
            src={event.thumbnail}
            alt={event.name || "Event"}
            width={176}
            height={176}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <span className="text-4xl font-bold text-purple-300">{initial}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge(event.status)}
          {event.category && (
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
              {event.category}
            </span>
          )}
        </div>
        <p className="text-base font-semibold text-foreground truncate">
          {event.name}
        </p>
        {event.start && (
          <p className="text-sm text-muted-foreground">
            {formatDate(event.start)}
          </p>
        )}
        <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
          {event.is_online ? (
            <>
              <Globe className="h-3.5 w-3.5 shrink-0" />
              Online
            </>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {event.location_name || "TBA"}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {event.registered}
          </span>{" "}
          registered &nbsp;·&nbsp;
          <span className="font-medium text-foreground tabular-nums">
            {event.attended}
          </span>{" "}
          attended
        </p>
      </div>

      {/* Right side */}
      <div className="shrink-0 flex flex-col items-end gap-2">
        <span
          className={`text-sm font-semibold tabular-nums ${isLive ? "text-green-600" : "text-muted-foreground"}`}
        >
          {rel}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            isLive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-[#F9ECFF] text-[#854ECB] hover:bg-purple-200"
          }`}
        >
          {isLive ? "Check in" : "Manage"}
        </button>
      </div>
    </li>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const { activeClubId } = useClubStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: events, isLoading } = useSWR<EventCardDetailsWithStats[]>(
    activeClubId ? `/api/events?club_id=${activeClubId}` : null,
    fetcher,
  );

  const showSkeleton = !activeClubId || isLoading;

  const now = new Date();

  const filtered = (events ?? []).filter((e) => {
    if (filter === "all") return true;
    if (filter === "live") return e.status === "live";
    if (filter === "draft") return e.status === "draft";
    if (filter === "upcoming")
      return (
        e.status !== "live" &&
        e.status !== "draft" &&
        e.start != null &&
        new Date(e.start) > now
      );
    if (filter === "past")
      return (
        e.start != null &&
        new Date(e.start) <= now &&
        e.status !== "live" &&
        e.status !== "draft"
      );
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button
          onClick={() => {
            /* TODO */
          }}
        >
          <Plus className="size-4" />
          Publish New Event
        </Button>
      </div>

      {/* Filter tabs */}
      <PillTabs
        tabs={[
          { label: "All", value: "all" },
          { label: "Live", value: "live" },
          { label: "Upcoming", value: "upcoming" },
          { label: "Past", value: "past" },
          { label: "Drafts", value: "draft" },
        ]}
        value={filter}
        onValueChange={(v) => setFilter(v as FilterType)}
      />

      {/* Event list */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {showSkeleton ? (
          <ul className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <EventRowSkeleton />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No events found</p>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "Create an event to get started."
                  : `No ${filter} events yet.`}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
