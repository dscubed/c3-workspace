"use client";

import { AppSidebar } from "@c3/ui";
import { getLoginUrl } from "@/lib/auth/sso";

export function Sidebar() {
  return (
    <AppSidebar
      currentApp="ticketing"
      onLogin={() => {
        window.location.href = getLoginUrl(window.location.origin, "/dashboard");
      }}
      onSignUp={() => {
        window.location.href = getLoginUrl(window.location.origin, "/dashboard", "signup");
      }}
    />
  );
}
