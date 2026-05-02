"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNavbarDisplay } from "@/components/providers/NavbarDisplayProvider";

function HideNavbar() {
  const { setNavbarDisplay } = useNavbarDisplay();
  useEffect(() => {
    setNavbarDisplay(false);
    return () => setNavbarDisplay(true);
  }, [setNavbarDisplay]);
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <HideNavbar />
      <Sidebar />
      <main className="flex-1 md:ml-17 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
