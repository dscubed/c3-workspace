"use client";

import { use, useState } from "react";
import { ArrowLeft, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@c3/utils";
import { mockEvents, mockAttendees } from "@/lib/mock-data";

// TODO: implement — returning mock data directly
function getEvent(id: string) {
  return mockEvents.find((e) => e.id === id) ?? null;
}

const statusColors: Record<string, string> = {
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
  const event = getEvent(id);
  const [showScreen, setShowScreen] = useState(false);

  if (!event) {
    return (
      <div className="p-8">
        <Link
          href="/dashboard/events"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const checkedInCount = mockAttendees.filter((a) => a.checkedIn).length;

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

        {/* Description */}
        <p className="text-muted-foreground">
          Join us for an amazing event where members can network, learn, and
          grow together. Refreshments provided. All are welcome.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Total Registrations</p>
            <p className="text-3xl font-bold mt-1">{event.registrations}</p>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Tickets Sold</p>
            <p className="text-3xl font-bold mt-1">{event.ticketsSold}</p>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-3xl font-bold mt-1">
              ${event.revenue.toLocaleString()}
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
                /* TODO */
              }}
            >
              <Download className="size-4" />
              Export Attendees CSV
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Check-in Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockAttendees.map((attendee) => (
                <tr
                  key={attendee.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">{attendee.name}</td>
                  <td className="px-4 py-3">
                    {attendee.checkedIn ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Checked In
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                        Not Checked In
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
