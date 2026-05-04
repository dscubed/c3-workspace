import type { Chunk, EventHostRow } from "../../types";

export function chunkEventHosts(
  eventId: string,
  title: string,
  hosts: EventHostRow[],
): Chunk | null {
  if (hosts.length === 0) return null;

  const lines: string[] = [`# Hosts for: ${title}`];
  for (const h of hosts) {
    const name = h.name ?? `host:${h.profile_id}`;
    const role = h.role ? ` (${h.role})` : "";
    lines.push(`- **${name}**${role}${h.bio ? `: ${h.bio}` : ""}`);
  }

  return {
    entityType: "event",
    entityId: eventId,
    chunkType: "hosts",
    chunkIndex: 0,
    title,
    text: lines.join("\n"),
    metadata: { host_count: hosts.length },
  };
}
