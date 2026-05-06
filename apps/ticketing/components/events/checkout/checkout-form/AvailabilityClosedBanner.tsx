"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

export function AvailabilityClosedBanner() {
  const { isDark, colors, checkoutMode } = useCheckoutContext();
  const isRegistration = checkoutMode === "registration";

  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center",
        colors.cardBg,
        colors.cardBorder,
      )}
    >
      <Clock className={cn("h-10 w-10 opacity-40", colors.textMuted)} />
      <p className={cn("font-semibold", colors.text)}>
        {isRegistration ? "Registration is closed" : "Ticketing is closed"}
      </p>
      <p className={cn("text-sm max-w-xs", colors.textMuted)}>
        {isRegistration
          ? "Registration opens at the event start time and closes at the end of the event."
          : "Tickets are only available from event start until the event ends."}
      </p>
    </div>
  );
}
