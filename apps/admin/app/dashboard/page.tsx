"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Globe,
  Users,
  CalendarClock,
} from "lucide-react";
import { useAuthStore } from "@c3/auth";
import { useClubStore } from "@c3/auth";
import { fetcher } from "@c3/utils";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const PURPLE = "#854ECB";

interface UpcomingEvent {
  id: string;
  name: string | null;
  start: string | null;
  status: "live" | "upcoming";
  thumbnail: string | null;
  location: string | null;
  registered: number;
}

interface DashboardStats {
  upcomingEvents: UpcomingEvent[];
  weekly: {
    members: number[];
    eventRegistrations: number[];
    eventAttendees: number[];
  };
}

function pctChange(data: number[]) {
  if (data.length < 2 || data[data.length - 2] === 0) return 0;
  return (
    ((data[data.length - 1] - data[data.length - 2]) / data[data.length - 2]) *
    100
  );
}

function shortFmt(prefix = "") {
  return (v: number) =>
    v >= 1000
      ? `${prefix}${(v / 1000).toFixed(1)}k`
      : `${prefix}${Math.round(v)}`;
}

function buildChartData(data: number[]) {
  const labels = [
    "7w ago",
    "6w ago",
    "5w ago",
    "4w ago",
    "3w ago",
    "Last wk",
    "This wk",
  ];
  return data.map((value, i) => ({ label: labels[i] ?? `${i}`, value }));
}

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

function MetricSection({
  label,
  value,
  data,
  isLast,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  data: number[];
  isLast?: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const pct = pctChange(data);
  const up = pct >= 0;
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 flex flex-col gap-1.5 px-6 py-5 text-left transition-colors hover:bg-gray-50/70",
        !isLast ? "border-r border-gray-100" : "",
        isActive
          ? "border-b-[2.5px] border-b-[#854ECB]"
          : "border-b-[2.5px] border-b-transparent",
      ].join(" ")}
    >
      <span className="text-xs text-muted-foreground font-medium tracking-wide">
        {label}
      </span>
      <p className="text-[1.6rem] font-bold text-foreground leading-none tabular-nums">
        {value}
      </p>
      <div
        className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-[#854ECB]" : "text-red-500"}`}
      >
        {up ? (
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          {up ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
        <span className="text-muted-foreground font-normal ml-1 text-[11px]">
          vs last week
        </span>
      </div>
    </button>
  );
}

type MetricId = "members" | "eventRegistrations" | "eventAttendees" | "searchAppearances";

export default function OverviewPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { clubs, activeClubId } = useClubStore();
  const [selected, setSelected] = useState<MetricId>("members");

  const { data: dashboard, isLoading } = useSWR<DashboardStats>(
    activeClubId ? `/api/admin/dashboard/stats?club_id=${activeClubId}` : null,
    fetcher,
  );

  const weekly = dashboard?.weekly;
  const upcomingEvents = dashboard?.upcomingEvents ?? [];

  const metricDefs: { id: MetricId; label: string; data: number[]; fmt: (v: number) => string; tickFmt: (v: number) => string }[] = [
    {
      id: "members",
      label: "Members",
      data: weekly?.members ?? [],
      fmt: shortFmt(),
      tickFmt: shortFmt(),
    },
    {
      id: "eventRegistrations",
      label: "Event Registrations",
      data: weekly?.eventRegistrations ?? [],
      fmt: shortFmt(),
      tickFmt: shortFmt(),
    },
    {
      id: "eventAttendees",
      label: "Event Attendees",
      data: weekly?.eventAttendees ?? [],
      fmt: shortFmt(),
      tickFmt: shortFmt(),
    },
    {
      id: "searchAppearances",
      label: "Search Appearances",
      data: [],
      fmt: () => "Coming soon",
      tickFmt: () => "",
    },
  ];

  const activeMetric = metricDefs.find((m) => m.id === selected) ?? metricDefs[0];
  const chartData = activeMetric.data.length > 0
    ? buildChartData(activeMetric.data)
    : [];

  const firstName = profile?.first_name ?? "there";
  const activeClub = clubs.find((c) => c.club_id === activeClubId);
  const clubName = activeClub?.club?.first_name ?? "your club";

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl">
      <p className="text-sm md:text-base lg:text-lg xl:text-xl">
        <span className="font-bold">Hey {firstName}</span>
        <span className="text-muted-foreground">
          {" "}
          — here&apos;s how <span className="italic">{clubName}</span> has been
          doing
        </span>
      </p>

      {/* Upcoming Events + Recent Activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-foreground">
              Upcoming Events
            </h2>
            <button
              onClick={() => router.push("/dashboard/events")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </button>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No upcoming events.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => {
                const isLive = event.status === "live";
                const initial = event.name?.charAt(0).toUpperCase() || "?";
                const timeLabel = isLive
                  ? "Happening now"
                  : event.start
                    ? new Date(event.start).toLocaleDateString("en-AU", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;
                return (
                  <li key={event.id} className="flex gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors">
                    {/* Thumbnail */}
                    <div className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden flex items-center justify-center ${isLive ? "bg-green-100" : "bg-purple-100"}`}>
                      {event.thumbnail ? (
                        <Image
                          src={event.thumbnail}
                          alt={event.name || "Event"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span className={`text-xl font-bold ${isLive ? "text-green-600" : "text-purple-500"}`}>
                          {initial}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                        {isLive && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {timeLabel && (
                          <span className={`flex items-center gap-1 text-xs ${isLive ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                            <CalendarClock className="h-3 w-3 shrink-0" />
                            {timeLabel}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {event.location === "Online"
                            ? <Globe className="h-3 w-3 shrink-0" />
                            : <MapPin className="h-3 w-3 shrink-0" />
                          }
                          <span className="truncate max-w-[140px]">{event.location ?? "TBA"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3 shrink-0" />
                          {event.registered} registered
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                      <button
                        onClick={() => router.push(`/events/${event.id}/checkin`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      >
                        Check in
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/events/${event.id}`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#F9ECFF] text-[#854ECB] hover:bg-purple-200 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent activity — coming soon */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="relative">
            <ul className="divide-y divide-gray-100 pointer-events-none select-none" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-6 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-12 shrink-0" />
                </li>
              ))}
            </ul>
            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
              <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics header */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Analytics
      </p>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {metricDefs.map((m, i) => (
            <MetricSection
              key={m.id}
              label={m.label}
              value={m.data.length > 0 ? m.fmt(m.data[m.data.length - 1]) : m.fmt(0)}
              data={m.data}
              isLast={i === metricDefs.length - 1}
              isActive={selected === m.id}
              onClick={() => setSelected(m.id)}
            />
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-5">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full rounded" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 3"
                stroke="#e5e7eb"
                vertical={true}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={activeMetric.tickFmt}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
                formatter={(val) => [
                  activeMetric.tickFmt(val as number),
                  activeMetric.label,
                ]}
                labelStyle={{ color: "#6b7280" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={PURPLE}
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ r: 3.5, fill: "white", stroke: PURPLE, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: PURPLE }}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              No data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
