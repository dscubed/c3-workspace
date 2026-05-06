/**
 * Zod schemas for event form data.
 *
 * These are the single source of truth for all event-related types.
 * TypeScript types are derived via `z.infer<>` — never declared manually.
 *
 * Adding a new field:
 *  1. Add it to the relevant sub-schema (or to EventFormDataSchema directly).
 *  2. TypeScript will error on FIELD_TO_GROUP until you add the group mapping.
 *  3. Update buildPatchBody in patchEvent.ts for the relevant FieldGroup.
 */

import { z } from "zod";
import type { FieldGroup } from "@/lib/api/patchEvent";

/* ── Sub-schemas ─────────────────────────────────────────────────── */

export const LocationTypeSchema = z.enum([
  "physical",
  "custom",
  "online",
  "tba",
]);

export const OccurrenceFormDataSchema = z.object({
  /** nanoid for new rows, DB UUID for existing */
  id: z.string(),
  name: z.string().optional(),
  startDate: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:MM
  endDate: z.string(),
  endTime: z.string(),
  venueIds: z.array(z.string()).optional(),
});

export const LocationDataSchema = z.object({
  displayName: z.string(),
  address: z.string(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

export const VenueSchema = z.object({
  /** nanoid for new rows, DB UUID for existing */
  id: z.string(),
  type: LocationTypeSchema,
  location: LocationDataSchema,
  onlineLink: z.string().optional(),
});

export const TicketTierSchema = z.object({
  id: z.string(),
  memberVerification: z.boolean().optional(),
  /** Required display name (e.g. "General Admission", "VIP") */
  name: z.string(),
  /** Price in AUD dollars — 0 means free */
  price: z.number().min(0),
  /** Stripe Price id, set after server sync */
  stripePriceId: z.string().nullable().optional(),
  /** null = unlimited; must be a positive integer when set */
  quantity: z.number().int().positive().nullable().optional(),
  /** Offer window — all four must be set together; end must be after start */
  offerStartDate: z.string().optional(), // YYYY-MM-DD
  offerStartTime: z.string().optional(), // HH:MM
  offerEndDate: z.string().optional(),
  offerEndTime: z.string().optional(),
  /** Number of tickets sold for this tier (populated at fetch time) */
  sold: z.number().int().nonnegative().optional(),
});

export const EventLinkSchema = z.object({
  id: z.string(),
  /** Raw URL — validation is intentionally loose so drafts can hold partial URLs */
  url: z.string(),
  /** Display label — empty string means show the URL itself */
  title: z.string(),
});

export const ThemeModeSchema = z.enum(["light", "dark", "adaptive"]);
export const ThemeLayoutSchema = z.enum(["card", "classic"]);
export const ThemeAccentSchema = z.enum([
  "none",
  "yellow",
  "cyan",
  "purple",
  "orange",
  "green",
  "custom",
]);

export const EventThemeSchema = z.object({
  mode: ThemeModeSchema,
  layout: ThemeLayoutSchema,
  accent: ThemeAccentSchema,
  /** Hex colour used when accent === "custom" */
  accentCustom: z.string().optional(),
  /** Solid background colour (card layout only) */
  bgColor: z.string().optional(),
});

/* ── Main form schema ────────────────────────────────────────────── */

/**
 * The complete shape of the event editor's form state.
 *
 * Every field that can be edited in the form is here.
 * Adding a field to this schema automatically propagates to the TS type
 * and causes a compile error in FIELD_TO_GROUP until you map it.
 */
export const EventFormDataSchema = z.object({
  name: z.string(),
  description: z.string(),

  /* ── Timing ── */
  startDate: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:MM
  endDate: z.string(),
  endTime: z.string(),
  timezone: z.string(), // IANA tz identifier

  /* ── Location ── */
  location: LocationDataSchema,
  isOnline: z.boolean(),
  locationType: LocationTypeSchema,
  onlineLink: z.string(),
  venues: z.array(VenueSchema),

  /* ── Recurrence ── */
  isRecurring: z.boolean(),
  occurrences: z.array(OccurrenceFormDataSchema),

  /* ── Metadata ── */
  category: z.string(),
  tags: z.array(z.string()),
  hostIds: z.array(z.string()),

  /* ── Media ── */
  imageUrls: z.array(z.string()),

  /* ── Ticketing ── */
  pricing: z.array(TicketTierSchema),
  eventCapacity: z.number().int().positive().nullable().optional(),

  /* ── Links ── */
  links: z.array(EventLinkSchema),

  /* ── Theme ── */
  theme: EventThemeSchema,
});

/* ── Derived TypeScript types ────────────────────────────────────── */

export type LocationType = z.infer<typeof LocationTypeSchema>;
export type OccurrenceFormData = z.infer<typeof OccurrenceFormDataSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type TicketTier = z.infer<typeof TicketTierSchema>;
export type EventLink = z.infer<typeof EventLinkSchema>;
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export type ThemeLayout = z.infer<typeof ThemeLayoutSchema>;
export type ThemeAccent = z.infer<typeof ThemeAccentSchema>;
export type EventTheme = z.infer<typeof EventThemeSchema>;
export type EventFormData = z.infer<typeof EventFormDataSchema>;

/* ── Field → FieldGroup mapping ─────────────────────────────────── */

/**
 * Maps every EventFormData key to the FieldGroup that owns it.
 *
 * TypeScript enforces exhaustiveness: if you add a field to EventFormDataSchema
 * and forget to add a mapping here, the build will fail. This is intentional —
 * it prevents silent auto-save gaps when the schema evolves.
 */
export const FIELD_TO_GROUP: Record<keyof EventFormData, FieldGroup> = {
  name: "event",
  description: "event",
  startDate: "event",
  startTime: "event",
  endDate: "event",
  endTime: "event",
  timezone: "event",
  isOnline: "event",
  isRecurring: "event",
  category: "event",
  tags: "event",
  locationType: "location",
  onlineLink: "location",
  location: "location",
  venues: "location",
  occurrences: "occurrences",
  imageUrls: "images",
  hostIds: "hosts",
  pricing: "pricing",
  eventCapacity: "pricing",
  links: "links",
  theme: "theme",
} as const;
