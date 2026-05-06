"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useSWR from "swr";
import { fetcher } from "@c3/utils";
import { toast } from "sonner";

interface StripeStatus {
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  connected_at: string | null;
}

export default function StripePage() {
  const { data, isLoading, mutate } = useSWR<StripeStatus>(
    "/api/admin/stripe/status",
    fetcher,
  );
  const [connecting, setConnecting] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/admin/stripe/connect", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Failed to start Stripe Connect");
        return;
      }
      window.location.href = body.data.url;
    } catch {
      toast.error("Network error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/admin/stripe/dashboard", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Failed to open Stripe dashboard");
        return;
      }
      window.open(body.data.url, "_blank");
    } catch {
      toast.error("Network error");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/stripe/disconnect", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Failed to disconnect");
        return;
      }
      toast.success("Stripe account disconnected");
      setShowDisconnect(false);
      mutate();
    } catch {
      toast.error("Network error");
    } finally {
      setDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center justify-center min-h-100">
          <Skeleton className="h-64 w-full max-w-md rounded-lg" />
        </div>
      </div>
    );
  }

  const hasAccount = !!data?.stripe_account_id;
  const fullyActive = hasAccount && data?.charges_enabled && data?.payouts_enabled;
  const onboardingIncomplete = hasAccount && !data?.charges_enabled;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Stripe</h1>

      {!hasAccount ? (
        <div className="flex items-center justify-center min-h-100">
          <div className="rounded-lg border bg-white p-10 max-w-md w-full text-center space-y-4">
            <div className="flex items-center justify-center size-14 rounded-full bg-gray-100 mx-auto">
              <CreditCard className="size-7 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold">Connect Stripe</h2>
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to accept payments for ticket sales.
            </p>
            <Button className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Stripe"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Stripe to authorize Connect3.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-lg">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Stripe Account</h2>
              {fullyActive ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Setup Required
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payments</span>
                <Badge
                  className={
                    data?.charges_enabled
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {data?.charges_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payouts</span>
                <Badge
                  className={
                    data?.payouts_enabled
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {data?.payouts_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {data?.connected_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected since</span>
                  <span className="font-medium">
                    {new Date(data.connected_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {onboardingIncomplete && (
            <Button className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Finish Stripe Onboarding"
              )}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDashboard}
            disabled={dashboardLoading}
          >
            {dashboardLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="size-4 mr-2" />
            )}
            View Stripe Dashboard
          </Button>

          <Button
            variant="outline"
            className="w-full text-destructive border-destructive hover:bg-destructive/5"
            onClick={() => setShowDisconnect(true)}
          >
            Disconnect Stripe
          </Button>
        </div>
      )}

      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Stripe?</DialogTitle>
            <DialogDescription>
              This will remove your Stripe account connection. You won&apos;t be
              able to accept payments until you reconnect. Existing payouts are
              not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnect(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
