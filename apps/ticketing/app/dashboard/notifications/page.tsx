"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Bell className="h-10 w-10 opacity-30" />
          <p className="text-sm">No notifications</p>
        </div>
      </div>
    </div>
  );
}
