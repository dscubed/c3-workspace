"use client";

import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

export function CheckoutHeader() {
  const { checkoutMode, eventName, colors } = useCheckoutContext();

  return (
    <div className="mb-2">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {checkoutMode === "registration" ? "Register" : "Checkout"}
      </h1>
      {eventName && (
        <p className={cn("mt-1 text-sm", colors.textMuted)}>{eventName}</p>
      )}
    </div>
  );
}
