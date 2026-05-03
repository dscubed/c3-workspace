"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuthStore } from "@c3/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsFeed } from "@/components/dashboard/NotificationsFeed";
import { Separator } from "@/components/ui/separator";
import {
  Ticket,
  CalendarDays,
  ShoppingBag,
  Loader2,
  Building2,
  ArrowRight,
} from "lucide-react";

/* ── Types ── */
import type { EventCardDetails } from "@c3/types";
import { EventDisplayCard } from "@c3/ui/components/events/EventDisplayCard";
import { fetcher } from "@/lib/fetcher";

interface ClubProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface ClubAdminRow {
  id: string;
  club_id: string;
  role: string;
  status: string;
  created_at: string;
  club: ClubProfile | null;
}

const PREVIEW_COUNT = 3;

export function UserDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: clubsData, isLoading: clubsLoading } = useSWR<{
    data: ClubAdminRow[];
  }>(user ? "/api/clubs/my-clubs" : null, fetcher);
  const clubs: ClubAdminRow[] = clubsData?.data ?? [];

  const { data: eventsData, isLoading: eventsLoading } = useSWR<{
    data: EventCardDetails[];
  }>(user ? `/api/events?recent=true&limit=${PREVIEW_COUNT}` : null, fetcher);
  const recentEvents: EventCardDetails[] = eventsData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          View your tickets, orders, and manage club events.
        </p>
      </div>

      {/* Notifications (collab + club admin invites) */}
      <NotificationsFeed mode="user" />

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Events you&apos;re attending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Manage Clubs ── */}
      {clubsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : clubs.length > 0 ? (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Manage Clubs</h2>
              <div className="flex -space-x-2">
                {clubs.map((c) => {
                  const p = c.club;
                  return (
                    <Avatar
                      key={c.id}
                      className="h-7 w-7 border-2 border-background"
                    >
                      {p?.avatar_url && (
                        <AvatarImage src={p.avatar_url} alt={p.first_name} />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {p?.first_name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => router.push("/dashboard/manage")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}

      {/* ── Recent Events (across all clubs) ── */}
      <div className="space-y-3">
        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recentEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">No recent events</p>
                <p className="text-xs text-muted-foreground">
                  Events you edit will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recentEvents.map((event) => (
              <EventDisplayCard
                key={event.id}
                event={event}
                onClick={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Your events */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Your Events</h2>
        <Card>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No upcoming events</p>
                <p className="text-sm text-muted-foreground">
                  When you purchase tickets, your events will show up here.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground">
                  Your ticket purchases will appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
    </div>
  );
}
