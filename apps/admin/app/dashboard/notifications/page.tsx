"use client";

import { useState } from "react";
import { UserCheck, Ticket, ScanLine, Shield, Handshake } from "lucide-react";
import { cn } from "@c3/utils";
import { mockActivity } from "@/lib/mock-data";

type ActivityType =
  | "all"
  | "membership"
  | "ticket"
  | "check_in"
  | "committee"
  | "collaboration";

const tabs: { label: string; value: ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Memberships", value: "membership" },
  { label: "Tickets", value: "ticket" },
  { label: "Check-ins", value: "check_in" },
  { label: "Committee", value: "committee" },
  { label: "Collaborations", value: "collaboration" },
];

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

export default function NotificationsPage() {
  const [active, setActive] = useState<ActivityType>("all");

  const filtered =
    active === "all"
      ? mockActivity
      : mockActivity.filter((a) => a.type === active);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActive(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              active === t.value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground text-center">
            No notifications.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((item) => {
              const {
                icon: Icon,
                bg,
                color,
                label,
              } = activityMeta(item.type, item.actor, item.detail);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors"
                >
                  <div
                    className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${bg}`}
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
        )}
      </div>
    </div>
  );
}
