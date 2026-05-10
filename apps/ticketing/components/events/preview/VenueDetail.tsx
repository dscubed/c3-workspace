"use client";

import dynamic from "next/dynamic";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Globe, ExternalLink } from "lucide-react";
import type { Venue } from "../shared/types";

const LocationMap = dynamic(
  () =>
    import("../create/date-location/LocationMap").then((mod) => ({
      default: mod.LocationMap,
    })),
  { ssr: false },
);

export function VenueAccordionItem({
  venue,
  itemValue,
}: {
  venue: Venue;
  itemValue: string;
}) {
  const hasCoords =
    venue.location.lat != null &&
    venue.location.lon != null &&
    !isNaN(venue.location.lat) &&
    !isNaN(venue.location.lon);

  if (venue.type === "online") {
    return (
      <AccordionItem value={itemValue} className="border-b-0">
        <AccordionTrigger className="py-2 text-sm hover:no-underline">
          <div className="flex items-center gap-2 text-left">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">Online</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-2 pl-6">
          {venue.onlineLink && (
            <a
              href={venue.onlineLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {venue.onlineLink}
            </a>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  }

  if (venue.type === "tba") {
    return (
      <div className="flex items-center gap-2 py-2 pl-0.5">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Location to be announced
        </span>
      </div>
    );
  }

  // Physical / custom venue — collapsible to show map
  return (
    <AccordionItem value={itemValue} className="border-b-0">
      <AccordionTrigger className="py-2 text-sm hover:no-underline">
        <div className="flex min-w-0 items-center gap-2 text-left">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <span className="block truncate font-medium">
              {venue.location.displayName || "Unnamed venue"}
            </span>
            {venue.location.address && (
              <span className="block truncate text-xs text-muted-foreground">
                {venue.location.address}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-2">
        {hasCoords && (
          <LocationMap
            lat={venue.location.lat!}
            lon={venue.location.lon!}
            height={160}
            className="overflow-hidden rounded-md"
          />
        )}
        {!hasCoords && venue.location.address && (
          <p className="pl-6 text-xs text-muted-foreground">
            {venue.location.address}
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

/** Collapsible venue list — for use inside occurrence accordion content */
export function VenueInlineList({ venues }: { venues: Venue[] }) {
  return (
    <Accordion type="multiple" className="w-full">
      {venues.map((v) => (
        <VenueAccordionItem key={v.id} venue={v} itemValue={`inline-${v.id}`} />
      ))}
    </Accordion>
  );
}
