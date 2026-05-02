"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StripePage() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stripe</h1>
        {/* Dev-only toggle */}
        <button
          onClick={() => setIsConnected((v) => !v)}
          className="text-xs text-muted-foreground underline"
        >
          Toggle connected state
        </button>
      </div>

      {!isConnected ? (
        /* Not connected */
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border bg-white p-10 max-w-md w-full text-center space-y-4">
            <div className="flex items-center justify-center size-14 rounded-full bg-gray-100 mx-auto">
              <CreditCard className="size-7 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold">Connect Stripe</h2>
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to accept payments for ticket sales.
            </p>
            <Button
              className="w-full"
              onClick={() => {/* TODO: implement Stripe Connect OAuth */}}
            >
              Connect Stripe
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Stripe to authorize Connect3.
            </p>
          </div>
        </div>
      ) : (
        /* Connected */
        <div className="space-y-4 max-w-lg">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">DS Cubed Stripe Account</h2>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Active
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout schedule</span>
                <span className="font-medium">Weekly, every Monday</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last payout</span>
                <span className="font-medium">$1,240.00 on 21 Apr 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account health</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Healthy
                </Badge>
              </div>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/5" onClick={() => {/* TODO */}}>
                  Disconnect Stripe
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                You have upcoming paid events — disconnecting Stripe will disable ticket sales
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
