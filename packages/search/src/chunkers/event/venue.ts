import type { Chunk, EventVenueRow } from "../../types";

export function chunkEventVenue(
  eventId: string,
  title: string,
  venues: EventVenueRow[],
): Chunk | null {
  if (venues.length === 0) return null;

  const lines: string[] = [`# Venue for: ${title}`];
  for (const v of venues) {
    if (v.name) lines.push(`**Venue:** ${v.name}`);
    const addrParts = [v.address, v.city, v.postcode, v.country].filter(
      Boolean,
    );
    if (addrParts.length) lines.push(`**Address:** ${addrParts.join(", ")}`);
    if (v.online_link) lines.push(`**Link:** ${v.online_link}`);
    if (v.instructions) lines.push(`**Instructions:** ${v.instructions}`);
  }

  return {
    entityType: "event",
    entityId: eventId,
    chunkType: "venue",
    chunkIndex: 0,
    title,
    text: lines.join("\n"),
    metadata: {},
  };
}
