"use client";

import { useAuthStore } from "@c3/auth";
import { EventDisplayCard } from "@c3/ui/components/events/EventDisplayCard";
import type { EventCardDetails } from "@/lib/types/events";
import { useRouter } from "next/navigation";

const mockUpcoming: EventCardDetails[] = [
  {
    id: "1",
    name: "ML Workshop: Intro to PyTorch",
    start: "2026-05-10T18:00:00Z",
    location_name: "Engineering Building, Rm 201",
    status: "upcoming",
    is_online: false,
    thumbnail: null,
    category: "Workshop",
    host: { id: "host-1", first_name: "DS Cubed", avatar_url: null },
    collaborators: null,
  },
  {
    id: "2",
    name: "End of Year Gala",
    start: "2026-06-20T19:00:00Z",
    location_name: "Union House Ballroom",
    status: "upcoming",
    is_online: false,
    thumbnail: null,
    category: "Social",
    host: { id: "host-1", first_name: "DS Cubed", avatar_url: null },
    collaborators: null,
  },
  {
    id: "3",
    name: "DS Cubed General Meeting",
    start: "2026-04-28T18:00:00Z",
    location_name: "Engineering Building, Rm 101",
    status: "live",
    is_online: false,
    thumbnail: null,
    category: "General",
    host: { id: "host-1", first_name: "DS Cubed", avatar_url: null },
    collaborators: null,
  },
];

export default function DashboardHomePage() {
  const { profile } = useAuthStore();
  const firstName = profile?.first_name ?? "there";
  const router = useRouter();

  const sorted = [...mockUpcoming].sort((a, b) => {
    if (a.status === "live") return -1;
    if (b.status === "live") return 1;
    return (
      new Date(a.start || "").getTime() - new Date(b.start || "").getTime()
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <p className="text-xl">
        <span className="font-bold">Hey {firstName}</span>
        <span className="text-muted-foreground">
          {" "}
          — here&apos;s what&apos;s coming up
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {sorted.map((event) => (
          <EventDisplayCard
            key={event.id}
            event={event}
            onClick={() => router.push(`/events/${event.id}/edit`)}
          />
        ))}
      </div>
    </div>
  );
}
