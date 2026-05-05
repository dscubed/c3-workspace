"use client";

import { useRouter } from "next/navigation";
import { AppSidebar } from "@c3/ui";

export default function Sidebar() {
  const router = useRouter();
  return (
    <AppSidebar
      currentApp="connect3"
      onLogin={() => router.push("/auth/login")}
      onSignUp={() => router.push("/auth/sign-up")}
    />
  );
}