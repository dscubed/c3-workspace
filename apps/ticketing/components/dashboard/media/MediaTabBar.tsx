"use client";

import { Tabs, TabsList, TabsTrigger } from "@c3/ui/components/tabs";
import { useMediaTab } from "./MediaTabContext";
import { MediaTab } from "./types";

export function MediaTabBar({ children }: { children?: React.ReactNode }) {
  const { active, changeTab } = useMediaTab();

  return (
    <Tabs value={active} onValueChange={(v) => changeTab(v as MediaTab)}>
      <TabsList>
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="companies">Companies</TabsTrigger>
        <TabsTrigger value="panelists">Panelists</TabsTrigger>
        <TabsTrigger value="instagram">Instagram</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
