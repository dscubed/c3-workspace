import type { Chunk, EventRow } from "../../types";
import { fmtDate } from "./utils";

export function chunkEventOverview(event: EventRow, title: string): Chunk {
  const lines: string[] = [`# Event: ${title}`];
  if (event.category) lines.push(`**Category:** ${event.category}`);
  if (event.tags?.length) lines.push(`**Tags:** ${event.tags.join(", ")}`);
  if (event.start_date)
    lines.push(
      `**Date:** ${fmtDate(event.start_date)}${event.end_date ? ` → ${fmtDate(event.end_date)}` : ""}`,
    );
  if (event.status) lines.push(`**Status:** ${event.status}`);
  if (event.is_online != null)
    lines.push(`**Format:** ${event.is_online ? "Online" : "In-person"}`);
  if (event.description) lines.push(`\n${event.description}`);

  return {
    entityType: "event",
    entityId: event.id,
    chunkType: "overview",
    chunkIndex: 0,
    title,
    text: lines.join("\n"),
    metadata: {
      category: event.category,
      status: event.status,
      start_date: event.start_date,
      end_date: event.end_date,
      university: event.university ?? null,
    },
  };
}
