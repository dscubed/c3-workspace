"use client";

import { AppSidebar } from "@c3/ui";

export function Sidebar() {
  return (
    <AppSidebar
      currentApp="admin"
      onLogin={() => {
        const siteUrl = process.env.NEXT_PUBLIC_CONNECT3_URL ?? "http://localhost:3000";
        window.location.href = siteUrl;
      }}
    />
  );
}
