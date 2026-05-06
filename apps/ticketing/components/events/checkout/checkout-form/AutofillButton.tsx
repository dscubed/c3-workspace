"use client";

import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

interface AutofillButtonProps {
  ticketIndex: number;
}

export function AutofillButton({ ticketIndex }: AutofillButtonProps) {
  const { user, fillingMyData, handleBuyForMyself, isDark, isEditing } = useCheckoutContext();

  if (!user || isEditing) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-1.5 text-xs",
        isDark
          ? "text-white/70 hover:text-white hover:bg-white/10"
          : "text-black/60 hover:text-black hover:bg-black/10",
      )}
      onClick={() => handleBuyForMyself(ticketIndex)}
      disabled={fillingMyData}
    >
      {fillingMyData ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <UserCheck className="h-3.5 w-3.5" />
      )}
      Autofill my details
    </Button>
  );
}
