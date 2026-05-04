/* ── Section-card shared types ── */

// Re-export canonical section types from the shared package so app code can
// import from either location.
export { SECTION_TYPES } from "@c3/types";

import type { SectionType, SectionData } from "@c3/types";

export const SECTION_META: Record<
  SectionType,
  { label: string; description: string; icon: string }
> = {
  faq: {
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "HelpCircle",
  },
  "refund-policy": {
    label: "Refund Policy",
    description: "Describe your refund policy",
    icon: "ReceiptText",
  },
  "what-to-bring": {
    label: "What To Bring",
    description: "Items attendees should bring",
    icon: "Backpack",
  },
  panelists: {
    label: "Panelists / Lineup",
    description: "Speakers, performers, or panelists",
    icon: "Mic",
  },
  companies: {
    label: "Companies / Institutions",
    description: "Sponsors or participating companies",
    icon: "Building2",
  },
};

/** Create a blank section for a given type */
export function createBlankSection(type: SectionType): SectionData {
  switch (type) {
    case "faq":
      return { type: "faq", items: [{ question: "", answer: "" }] };
    case "what-to-bring":
      return { type: "what-to-bring", items: [{ item: "" }] };
    case "panelists":
      return {
        type: "panelists",
        items: [{ name: "", title: "", imageUrl: "" }],
      };
    case "companies":
      return { type: "companies", items: [{ name: "", logoUrl: "" }] };
    case "refund-policy":
      return { type: "refund-policy", text: "" };
  }
}

/** Shared drag-handle prop shape used by section cards */
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

export type { SyntheticListenerMap, DraggableAttributes };

export interface DragHandleProps {
  ref: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}
