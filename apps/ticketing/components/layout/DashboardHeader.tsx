"use client";

import { ClubSelectorDropdown } from "@c3/ui";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 h-12 flex items-center border-b bg-white px-6">
      <ClubSelectorDropdown />
    </header>
  );
}
