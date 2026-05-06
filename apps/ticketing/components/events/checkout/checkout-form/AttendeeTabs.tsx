"use client";

import { Plus } from "lucide-react";
import { PillTabs } from "@c3/ui";
import { useCheckoutContext } from "./CheckoutContext";
import { useAttendeeTabs } from "./useAttendeeTabs";

export function AttendeeTabs() {
  const {
    quantity,
    setQuantity,
    activeTicketTab,
    setActiveTicketTab,
    checkoutMode,
  } = useCheckoutContext();
  const { tabs, safeIndex } = useAttendeeTabs();

  if (checkoutMode === "ticket") return null;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <PillTabs
        tabs={tabs}
        value={activeTicketTab}
        onValueChange={setActiveTicketTab}
      />

      <button
        onClick={() => {
          const next = quantity + 1;
          setQuantity(next);
          setActiveTicketTab(`ticket-${next - 1}`);
        }}
        className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:border-solid hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>

      {quantity > 1 && (
        <button
          onClick={() => {
            const next = quantity - 1;
            setQuantity(next);
            if (safeIndex >= next) setActiveTicketTab(`ticket-${next - 1}`);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:border-red-400 hover:border-solid hover:text-red-500"
        >
          Remove
        </button>
      )}
    </div>
  );
}
