import type {
  Chunk,
  EventRow,
  EventVenueRow,
  EventTicketTierRow,
  EventSectionRow,
  EventHostRow,
} from "../types";

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
 *  section   — one chunk per event section (FAQ, panelists, companies, …)
 */
export function chunkEvent(bundle: EventBundle): Chunk[] {
  const { event, venues, ticketTiers, sections, hosts } = bundle;
  const chunks: Chunk[] = [];
  const title = event.name;

  // ── 1. Overview ──────────────────────────────────────────────────────────

  const overviewLines: string[] = [`# Event: ${title}`];
  if (event.category) overviewLines.push(`**Category:** ${event.category}`);
  if (event.tags?.length)
    overviewLines.push(`**Tags:** ${event.tags.join(", ")}`);
  if (event.start_date)
    overviewLines.push(
      `**Date:** ${fmtDate(event.start_date)}${event.end_date ? ` → ${fmtDate(event.end_date)}` : ""}`,
    );
  if (event.status) overviewLines.push(`**Status:** ${event.status}`);
  if (event.is_online != null)
    overviewLines.push(
      `**Format:** ${event.is_online ? "Online" : "In-person"}`,
    );
  if (event.description) overviewLines.push(`\n${event.description}`);

  chunks.push({
    entityType: "event",
    entityId: event.id,
    chunkType: "overview",
    chunkIndex: 0,
    title,
    text: overviewLines.join("\n"),
    metadata: {
      category: event.category,
      status: event.status,
      start_date: event.start_date,
      end_date: event.end_date,
      university: event.university ?? null,
    },
  });

  // ── 2. Venue(s) ───────────────────────────────────────────────────────────

  if (venues.length > 0) {
    const venueLines: string[] = [`# Venue for: ${title}`];
    for (const v of venues) {
      if (v.name) venueLines.push(`**Venue:** ${v.name}`);
      const addrParts = [v.address, v.city, v.postcode, v.country].filter(
        Boolean,
      );
      if (addrParts.length)
        venueLines.push(`**Address:** ${addrParts.join(", ")}`);
      if (v.online_link) venueLines.push(`**Link:** ${v.online_link}`);
      if (v.instructions)
        venueLines.push(`**Instructions:** ${v.instructions}`);
    }

    chunks.push({
      entityType: "event",
      entityId: event.id,
      chunkType: "venue",
      chunkIndex: 0,
      title,
      text: venueLines.join("\n"),
      metadata: {},
    });
  }

  // ── 3. Ticket tiers ───────────────────────────────────────────────────────

  if (ticketTiers.length > 0) {
    const tierLines: string[] = [`# Tickets for: ${title}`];
    for (const t of ticketTiers) {
      const price = t.is_free
        ? "Free"
        : t.price != null
          ? `${t.currency ?? "£"}${t.price}`
          : "TBA";
      const tierType = t.tier_type ? ` [${t.tier_type}]` : "";
      tierLines.push(
        `- **${t.name}**${tierType}: ${price}${t.description ? ` — ${t.description}` : ""}${t.capacity != null ? ` (${t.capacity} capacity)` : ""}`,
      );
    }

    chunks.push({
      entityType: "event",
      entityId: event.id,
      chunkType: "tickets",
      chunkIndex: 0,
      title,
      text: tierLines.join("\n"),
      metadata: { tier_count: ticketTiers.length },
    });
  }

  // ── 4. Hosts ──────────────────────────────────────────────────────────────

  if (hosts.length > 0) {
    const hostLines: string[] = [`# Hosts for: ${title}`];
    for (const h of hosts) {
      const name = h.name ?? `host:${h.profile_id}`;
      const role = h.role ? ` (${h.role})` : "";
      hostLines.push(`- **${name}**${role}${h.bio ? `: ${h.bio}` : ""}`);
    }

    chunks.push({
      entityType: "event",
      entityId: event.id,
      chunkType: "hosts",
      chunkIndex: 0,
      title,
      text: hostLines.join("\n"),
      metadata: { host_count: hosts.length },
    });
  }

  // ── 5. Sections (one chunk per section) ────────────────────────────────────

  const sortedSections = [...sections].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  for (let i = 0; i < sortedSections.length; i++) {
    const sec = sortedSections[i]!;
    const sectionTitle = sec.title ?? humaniseSectionType(sec.section_type);
    const body = renderSectionContent(sec);
    if (!body.trim()) continue;

    chunks.push({
      entityType: "event",
      entityId: event.id,
      chunkType: "section",
      chunkIndex: i,
      title,
      text: `# ${sectionTitle} — ${title}\n\n${body}`,
      metadata: { section_type: sec.section_type, section_id: sec.id },
    });
  }

  return chunks;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function humaniseSectionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderSectionContent(sec: EventSectionRow): string {
  const raw = sec.content;
  if (!raw) return "";

  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    return raw.map((item) => renderItem(item)).join("\n");
  }

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;

    switch (sec.section_type) {
      case "faq": {
        if (Array.isArray(obj["items"])) {
          return (obj["items"] as Array<{ question?: string; answer?: string }>)
            .map((qa) => `**Q: ${qa.question ?? ""}**\nA: ${qa.answer ?? ""}`)
            .join("\n\n");
        }
        break;
      }
      case "panelists":
      case "speakers": {
        if (Array.isArray(obj["items"])) {
          return (
            obj["items"] as Array<{
              name?: string;
              bio?: string;
              role?: string;
              company?: string;
            }>
          )
            .map(
              (p) =>
                `- **${p.name ?? ""}**${p.role ? ` (${p.role})` : ""}${p.company ? ` @ ${p.company}` : ""}${p.bio ? `: ${p.bio}` : ""}`,
            )
            .join("\n");
        }
        break;
      }
      case "companies":
      case "sponsors": {
        if (Array.isArray(obj["items"])) {
          return (
            obj["items"] as Array<{ name?: string; description?: string }>
          )
            .map(
              (c) =>
                `- **${c.name ?? ""}**${c.description ? `: ${c.description}` : ""}`,
            )
            .join("\n");
        }
        break;
      }
      case "schedule": {
        if (Array.isArray(obj["items"])) {
          return (
            obj["items"] as Array<{
              time?: string;
              title?: string;
              description?: string;
            }>
          )
            .map(
              (s) =>
                `- ${s.time ? `**${s.time}** ` : ""}${s.title ?? ""}${s.description ? `: ${s.description}` : ""}`,
            )
            .join("\n");
        }
        break;
      }
      default:
        break;
    }

    return Object.values(obj)
      .flat()
      .filter((v) => typeof v === "string")
      .join("\n");
  }

  return String(raw);
}

function renderItem(item: unknown): string {
  if (typeof item === "string") return `- ${item}`;
  if (typeof item === "object" && item !== null) {
    return Object.values(item as Record<string, unknown>)
      .filter((v) => typeof v === "string")
      .join(" — ");
  }
  return String(item);
}
