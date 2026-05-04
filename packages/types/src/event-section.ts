// ─── Event section shared types ───────────────────────────────────────────────
// Single source of truth for section types and their content shapes.
// Used by both `apps/ticketing` (editor UI) and `packages/search` (chunkers).

/**
 * All valid event section type identifiers.
 * To add a new section:
 *  1. Add its string literal here.
 *  2. Define its item type and data interface below.
 *  3. Add it to the `SectionData` union.
 *  4. Handle it in `packages/search/src/chunkers/event.ts` renderSectionContent.
 *  5. Handle it in `apps/ticketing` (card component, SECTION_META, createBlankSection).
 */
export const SECTION_TYPES = [
  "faq",
  "what-to-bring",
  "panelists",
  "companies",
  "refund-policy",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

// ─── Per-type item shapes ─────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export interface WhatToBringItem {
  item: string;
}

export interface Panelist {
  name: string;
  title: string;
  imageUrl: string;
}

export interface Company {
  name: string;
  logoUrl: string;
}

// ─── Per-type section data shapes ────────────────────────────────────────────

export interface FAQSectionData {
  type: "faq";
  items: FAQItem[];
}

export interface WhatToBringSectionData {
  type: "what-to-bring";
  items: WhatToBringItem[];
}

export interface PanelistsSectionData {
  type: "panelists";
  items: Panelist[];
}

export interface CompaniesSectionData {
  type: "companies";
  items: Company[];
}

export interface RefundPolicySectionData {
  type: "refund-policy";
  text: string;
}

/**
 * Discriminated union of all section content payloads.
 * The `type` field always matches the corresponding `SectionType` literal.
 */
export type SectionData =
  | FAQSectionData
  | WhatToBringSectionData
  | PanelistsSectionData
  | CompaniesSectionData
  | RefundPolicySectionData;
