"use client";

import { useState } from "react";
import { useClubStore } from "@c3/auth";
import { Plus, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDisplayCard } from "@c3/ui/components/events/EventDisplayCard";
import { EventDisplayCardSkeleton } from "@c3/ui";
import type { EventCardDetails } from "@c3/types";
import { fetcher } from "@c3/utils";
import useSWR from "swr";

type FilterType = "all" | "upcoming" | "past" | "draft" | "live";

export default function EventsPage() {
  const router = useRouter();
  const { activeClubId } = useClubStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: events, isLoading } = useSWR<EventCardDetails[]>(
    activeClubId ? `/api/events?club_id=${activeClubId}` : null,
    fetcher,
  );

  const showSkeleton = !activeClubId || isLoading;

  const filtered =
    filter === "all"
      ? (events ?? [])
      : (events ?? []).filter((e) => e.status === filter);

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
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Event cards grid */}
      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <EventDisplayCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-white overflow-hidden">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {filtered.map((event) => (
            <EventDisplayCard
              key={event.id}
              event={event}
              onClick={() => router.push(`/dashboard/events/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
