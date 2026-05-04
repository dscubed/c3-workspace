import type {
  Chunk,
  EventRow,
  EventVenueRow,
  EventTicketTierRow,
  EventSectionRow,
  EventHostRow,
} from "../../types";
import { chunkEventOverview } from "./overview";
import { chunkEventVenue } from "./venue";
import { chunkEventTickets } from "./tickets";
import { chunkEventHosts } from "./hosts";
import { chunkEventSections } from "./section";

/** All related rows for a single event. */
export interface EventBundle {
  event: EventRow;
  venues: EventVenueRow[];
  ticketTiers: EventTicketTierRow[];
  sections: EventSectionRow[];
  hosts: EventHostRow[];
}

/**
 * Produces up to 5 chunk types per event:
 *
 *  overview  — name + description + category + dates (always present)
 *  venue     — venue address / online link              (if venues exist)
 *  tickets   — ticket tier names, prices, types         (if tiers exist)
 *  hosts     — host names + roles + bios               (if hosts exist)
 *  section   — one chunk per event section (FAQ, what-to-bring, …)
 */
export function chunkEvent(bundle: EventBundle): Chunk[] {
  const { event, venues, ticketTiers, sections, hosts } = bundle;
  const title = event.name;

  const chunks: Chunk[] = [chunkEventOverview(event, title)];

  const venue = chunkEventVenue(event.id, title, venues);
  if (venue) chunks.push(venue);

  const tickets = chunkEventTickets(event.id, title, ticketTiers);
  if (tickets) chunks.push(tickets);

  const hostsChunk = chunkEventHosts(event.id, title, hosts);
  if (hostsChunk) chunks.push(hostsChunk);

  chunks.push(...chunkEventSections(event.id, title, sections));

  return chunks;
}
