"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

export function BackToEventButton() {
  const router = useRouter();
  const { eventId, isDark } = useCheckoutContext();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 py-2 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-2",
          isDark
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-black/60 hover:text-black hover:bg-black/10",
        )}
        onClick={() => router.push(`/events/${eventId}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Button>
    </div>
  );
}
