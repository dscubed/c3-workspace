import type { Chunk, EventSectionRow } from "../../types";

export function chunkEventSections(
  eventId: string,
  title: string,
  sections: EventSectionRow[],
): Chunk[] {
  const sorted = [...sections].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  const chunks: Chunk[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const sec = sorted[i]!;
    const sectionTitle = sec.title ?? humaniseSectionType(sec.section_type);
    const body = renderSectionContent(sec);
    if (!body.trim()) continue;

    chunks.push({
      entityType: "event",
      entityId: eventId,
      chunkType: "section",
      chunkIndex: i,
      title,
      text: `# ${sectionTitle} — ${title}\n\n${body}`,
      metadata: { section_type: sec.section_type, section_id: sec.id },
    });
  }
  return chunks;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function humaniseSectionType(type: string): string {
  return type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Converts a typed section payload to plain text for embedding.
 * The switch is exhaustive — TypeScript will error here if a new
 * SectionType is added to @c3/types without a corresponding case.
 */
function renderSectionContent(sec: EventSectionRow): string {
  const data = sec.content;
  if (!data) return "";

  switch (data.type) {
    case "faq":
      return data.items
        .map((qa) => `**Q: ${qa.question}**\nA: ${qa.answer}`)
        .join("\n\n");

    case "what-to-bring":
      return data.items.map((i) => `- ${i.item}`).join("\n");

    case "panelists":
      return data.items
        .map((p) => `- **${p.name}**${p.title ? ` (${p.title})` : ""}`)
        .join("\n");

    case "companies":
      return data.items.map((c) => `- **${c.name}**`).join("\n");

    case "refund-policy":
      return data.text;

    default: {
      // Exhaustiveness guard: if a new SectionType is added to @c3/types
      // and not handled above, TypeScript will error on this line.
      const _exhaustive: never = data;
      void _exhaustive;
      return "";
    }
  }
}
