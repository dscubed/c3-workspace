"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import type { RegistrationWithEvent } from "@c3/types";

const TICKETING_URL =
  process.env.NEXT_PUBLIC_TICKETING_URL ?? "https://tix.connect3.app";

async function fetchUpcoming(): Promise<RegistrationWithEvent[]> {
  const res = await fetch("/api/registrations/upcoming");
  if (!res.ok) return [];
  const { data } = await res.json();
  return data ?? [];
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

function UpcomingEventCard({ reg }: { reg: RegistrationWithEvent }) {
  const date = reg.event_start ? formatEventDate(reg.event_start) : null;

  return (
    <a
      href={`${TICKETING_URL}/events/${reg.event_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-56 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
        {reg.event_thumbnail ? (
          <Image
            src={reg.event_thumbnail}
            alt={reg.event_name ?? ""}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-violet-50">
            <Calendar className="w-8 h-8 text-violet-300" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {reg.event_name ?? "Untitled Event"}
        </p>
        {date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{date.day} · {date.time}</span>
          </div>
        )}
        {reg.event_venue && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{reg.event_venue}</span>
          </div>
        )}
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-56 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <div className="w-full h-32 bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-2/5" />
      </div>
    </div>
  );
}

export function UpcomingEvents() {
  const { data, isLoading } = useSWR<RegistrationWithEvent[]>(
    "/api/registrations/upcoming",
    fetchUpcoming,
  );

  const isEmpty = !isLoading && (!data || data.length === 0);

  return (
    <section className="px-4 md:px-8 lg:px-12 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            Your Upcoming Events
          </p>
          {!isEmpty && (
            <a
              href={`${TICKETING_URL}/my-tickets`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              View all →
            </a>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
            <Link
              href="/events"
              className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              Browse events →
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : data!.map((reg) => (
                  <UpcomingEventCard key={reg.id} reg={reg} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
