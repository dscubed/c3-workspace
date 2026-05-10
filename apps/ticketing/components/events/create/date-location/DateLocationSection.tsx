"use client";

import { Separator } from "@/components/ui/separator";
import { DateSection } from "./DateSection";
import { VenueSection } from "./VenueSection";

export function DateLocationSection() {
  return (
    <div className="space-y-5 pt-4">
      <DateSection />
      <Separator />
      <VenueSection />
    </div>
  );
}
