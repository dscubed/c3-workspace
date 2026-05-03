"use client";

import { createContext, useContext } from "react";
import type { DragEndEvent, useSensors } from "@dnd-kit/core";
import type { TicketingFieldDraft, TicketingFieldType } from "@/lib/types/ticketing";
import type { ThemeColors, ThemeLayout, TicketTier } from "@/components/events/shared/types";

export interface CheckoutContextValue {
  /* theme */
  layout: ThemeLayout;
  isDark: boolean;
  colors: ThemeColors;
  accentColor: string | undefined;
  /* ticketing */
  ticketingEnabled: boolean;
  ticketingChanging: boolean;
  handleEnableTicketing: () => void;
  pricingCount: number;
  /* checkout fields (editor) */
  fields: TicketingFieldDraft[];
  addField: (type: TicketingFieldType) => void;
  updateField: (id: string, updated: TicketingFieldDraft) => void;
  removeField: (id: string) => void;
  dndSensors: ReturnType<typeof useSensors>;
  fieldIds: string[];
  handleFieldDragEnd: (event: DragEndEvent) => void;
  /* attendee data (preview) */
  user: { id: string; email?: string | undefined } | null;
  fillingMyData: boolean;
  getFieldValue: (ticketIndex: number, fieldKey: string) => string;
  setFieldValue: (ticketIndex: number, fieldKey: string, value: string) => void;
  handleBuyForMyself: (ticketIndex: number) => void;
  /* ticket selection (preview) */
  pricing: TicketTier[];
  selectedTier: TicketTier | null;
  effectiveSelectedTierId: string;
  setSelectedTierId: (id: string) => void;
  thumbnailUrl: string | null;
  quantity: number;
  setQuantity: (update: number | ((q: number) => number)) => void;
  activeTicketTab: string;
  setActiveTicketTab: (tab: string) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckoutContext(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx)
    throw new Error(
      "useCheckoutContext must be used within <CheckoutContext.Provider>",
    );
  return ctx;
}

export { CheckoutContext };
