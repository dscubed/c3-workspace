"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  UserCheck,
  Ticket,
  ScanLine,
  Shield,
  Handshake,
} from "lucide-react";
import { useAuthStore } from "@c3/auth";
import { useClubStore } from "@c3/auth";
import { mockEvents, mockActivity } from "@/lib/mock-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const rawData = {
  members: [798, 810, 819, 825, 831, 840, 847],
  interactions: [1080, 1150, 1095, 1210, 1280, 1350, 1420],
  tickets: [180, 188, 193, 198, 204, 209, 214],
  revenue: [3600, 3720, 3850, 3980, 4080, 4190, 4280],
};

const WEEK_LABELS = [
  "6w ago",
  "5w ago",
  "4w ago",
  "3w ago",
  "2w ago",
  "Last wk",
  "This wk",
];
const PURPLE = "#854ECB";

function pctChange(data: number[]) {
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
  return data.map((value, i) => ({ label: WEEK_LABELS[i], value }));
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

function activityMeta(type: string, actor: string, detail: string | null) {
  switch (type) {
    case "membership":
      return {
        icon: UserCheck,
        bg: "bg-green-100",
        color: "text-green-600",
        label: `${actor} verified their membership`,
      };
    case "ticket":
      return {
        icon: Ticket,
        bg: "bg-blue-100",
        color: "text-blue-600",
        label: `${actor} bought a ticket${detail ? ` to ${detail}` : ""}`,
      };
    case "check_in":
      return {
        icon: ScanLine,
        bg: "bg-purple-100",
        color: "text-[#854ECB]",
        label: `${actor} checked into ${detail ?? "an event"}`,
      };
    case "committee":
      return {
        icon: Shield,
        bg: "bg-amber-100",
        color: "text-amber-600",
        label: `${actor} was added as a Committee Member`,
      };
    case "collaboration":
      return {
        icon: Handshake,
        bg: "bg-rose-100",
        color: "text-rose-600",
        label: `${actor} invited you to collaborate on ${detail ?? "an event"}`,
      };
    default:
      return {
        icon: UserCheck,
        bg: "bg-gray-100",
        color: "text-gray-500",
        label: `${actor} performed an action`,
      };
  }
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

const metrics = [
  {
    id: "members",
    label: "Members",
    data: rawData.members,
    fmt: shortFmt(),
    tickFmt: shortFmt(),
  },
  {
    id: "interactions",
    label: "User Interactions",
    data: rawData.interactions,
    fmt: shortFmt(),
    tickFmt: shortFmt(),
  },
  {
    id: "tickets",
    label: "Tickets Sold",
    data: rawData.tickets,
    fmt: shortFmt(),
    tickFmt: shortFmt(),
  },
  {
    id: "revenue",
    label: "Revenue",
    data: rawData.revenue,
    fmt: shortFmt("$"),
    tickFmt: shortFmt("$"),
  },
];

export default function OverviewPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { clubs, activeClubId } = useClubStore();
  const [selected, setSelected] = useState("members");

  const upcomingEvents = mockEvents
    .filter((e) => e.status === "live" || e.status === "upcoming")
    .sort((a, b) => {
      if (a.status === "live") return -1;
      if (b.status === "live") return 1;
      return (
        new Date(a.start || "").getTime() - new Date(b.start || "").getTime()
      );
    })
    .slice(0, 4);

  const firstName = profile?.first_name ?? "there";
  const activeClub = clubs.find((c) => c.club_id === activeClubId);
  const clubName = activeClub?.club?.first_name ?? "your club";
  const activeMetric = metrics.find((m) => m.id === selected) ?? metrics[0];
  const chartData = buildChartData(activeMetric.data);

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

          {upcomingEvents.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No upcoming events.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => {
                const isLive = event.status === "live";
                const rel = isLive ? "Now" : relativeTime(event.start || "");
                const initial = event.name?.charAt(0).toUpperCase() || "?";
                return (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                  >
                    <div
                      className={`shrink-0 h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center ${isLive ? "bg-green-100" : "bg-purple-100"}`}
                    >
                      {event.thumbnail ? (
                        <Image
                          src={event.thumbnail}
                          alt={event.name || "Event"}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span
                          className={`text-sm font-bold ${isLive ? "text-green-600" : "text-purple-500"}`}
                        >
                          {initial}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {event.name}
                        </p>
                        {isLive && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {event.location_name || "TBA"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-medium tabular-nums ${isLive ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {rel}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/events/${event.id}`);
                        }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
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
              })}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h2>
            <button
              onClick={() => router.push("/dashboard/notifications")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {mockActivity.slice(0, 5).map((item) => {
              const {
                icon: Icon,
                bg,
                color,
                label,
              } = activityMeta(item.type, item.actor, item.detail);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-6 py-3.5"
                >
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${bg}`}
                  >
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="flex-1 text-sm text-foreground">{label}</p>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {item.time}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Analytics header */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Analytics
      </p>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {metrics.map((m, i) => (
            <MetricSection
              key={m.id}
              label={m.label}
              value={m.fmt(m.data[m.data.length - 1])}
              data={m.data}
              isLast={i === metrics.length - 1}
              isActive={selected === m.id}
              onClick={() => setSelected(m.id)}
            />
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-5">
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
        </div>
      </div>
    </div>
  );
}
