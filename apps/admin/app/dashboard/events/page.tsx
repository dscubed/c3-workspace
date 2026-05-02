"use client";

import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockEvents } from "@/lib/mock-data";
import { EventDisplayCard } from "@/components/dashboard/EventDisplayCard";
import type { EventCardDetails } from "@/lib/types/events";

type FilterType = "all" | "upcoming" | "past" | "draft" | "live";

export default function EventsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const events = (mockEvents as any[]) as EventCardDetails[];

  const filtered =
    filter === "all" ? events : events.filter((e) => e.status === filter);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => {/* TODO */}}>
          <Plus className="size-4" />
          Publish New Event
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterType)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Event cards grid */}
      {filtered.length === 0 ? (
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
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {filtered.map((event) => (
            <EventDisplayCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}
