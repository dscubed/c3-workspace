"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Settings className="h-10 w-10 opacity-30" />
          <p className="text-sm">Settings coming soon</p>
        </div>
      </div>
    </div>
  );
}
