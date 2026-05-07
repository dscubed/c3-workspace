"use client";

import { useEffect } from "react";
import { useNavbarDisplay } from "@/components/providers/NavbarDisplayProvider";

export function HideNavbar() {
  const { setNavbarDisplay } = useNavbarDisplay();
  useEffect(() => {
    setNavbarDisplay(false);
    return () => setNavbarDisplay(true);
  }, [setNavbarDisplay]);
  return null;
}
