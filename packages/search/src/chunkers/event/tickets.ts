import type { Chunk, EventTicketTierRow } from "../../types";

export function chunkEventTickets(
  eventId: string,
  title: string,
  ticketTiers: EventTicketTierRow[],
): Chunk | null {
  if (ticketTiers.length === 0) return null;

  const lines: string[] = [`# Tickets for: ${title}`];
  for (const t of ticketTiers) {
    const price = t.is_free
      ? "Free"
      : t.price != null
        ? `${t.currency ?? "£"}${t.price}`
        : "TBA";
    const tierType = t.tier_type ? ` [${t.tier_type}]` : "";
    lines.push(
      `- **${t.name}**${tierType}: ${price}${t.description ? ` — ${t.description}` : ""}${t.capacity != null ? ` (${t.capacity} capacity)` : ""}`,
    );
  }

  return {
    entityType: "event",
    entityId: eventId,
    chunkType: "tickets",
    chunkIndex: 0,
    title,
    text: lines.join("\n"),
    metadata: { tier_count: ticketTiers.length },
  };
}
