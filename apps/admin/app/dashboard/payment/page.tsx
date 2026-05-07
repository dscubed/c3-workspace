"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Loader2, ArrowRight, Ticket } from "lucide-react";
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
import { fetcher, cn } from "@c3/utils";
import { useClubStore } from "@c3/auth";
import { toast } from "sonner";

interface StripeStatus {
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  connected_at: string | null;
}

interface EventSummary {
  id: string;
  name: string | null;
  start: string | null;
  end: string | null;
  status: string;
  total_gross: number;
  unsettled_amount: number;
  total_sold: number;
  settlement_deadline: string | null;
}

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function StripePage() {
  const router = useRouter();
  const { activeClubId } = useClubStore();
  const { data, isLoading, mutate } = useSWR<StripeStatus>(
    activeClubId ? `/api/admin/stripe/status?club_id=${activeClubId}` : null,
    fetcher,
  );
  const { data: eventsData, isLoading: eventsLoading } = useSWR<EventSummary[]>(
    activeClubId ? `/api/admin/events?club_id=${activeClubId}` : null,
    fetcher,
  );

  const [connecting, setConnecting] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleConnect = async () => {
    if (!activeClubId) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/admin/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: activeClubId }),
      });
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
    if (!activeClubId) return;
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/admin/stripe/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: activeClubId }),
      });
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
    if (!activeClubId) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/stripe/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: activeClubId }),
      });
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
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const hasAccount = !!data?.stripe_account_id;
  const fullyActive = hasAccount && data?.charges_enabled && data?.payouts_enabled;
  const onboardingIncomplete = hasAccount && !data?.charges_enabled;

  const events = eventsData ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

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
        <>
          {/* Stripe account card — full width */}
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Stripe Account</h2>
              {fullyActive ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Setup Required</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between sm:flex-col sm:gap-1">
                <span className="text-muted-foreground">Payments</span>
                <Badge
                  className={
                    data?.charges_enabled
                      ? "bg-green-100 text-green-700 border-green-200 w-fit"
                      : "bg-gray-100 text-gray-600 border-gray-200 w-fit"
                  }
                >
                  {data?.charges_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between sm:flex-col sm:gap-1">
                <span className="text-muted-foreground">Payouts</span>
                <Badge
                  className={
                    data?.payouts_enabled
                      ? "bg-green-100 text-green-700 border-green-200 w-fit"
                      : "bg-gray-100 text-gray-600 border-gray-200 w-fit"
                  }
                >
                  {data?.payouts_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {data?.connected_at && (
                <div className="flex justify-between sm:flex-col sm:gap-1">
                  <span className="text-muted-foreground">Connected since</span>
                  <span className="font-medium">
                    {new Date(data!.connected_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {onboardingIncomplete && (
                <Button size="sm" onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Finish Stripe Onboarding
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleDashboard} disabled={dashboardLoading}>
                {dashboardLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="size-4 mr-2" />
                )}
                View Stripe Dashboard
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/5"
                onClick={() => setShowDisconnect(true)}
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Ticketed events table */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Ticket className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Ticketed Events</h2>
            </div>

            {eventsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No ticketed events yet. Create an event and add ticket tiers to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Settlement Deadline</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Unsettled</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => {
                      const now = new Date();
                      const deadlineDate = e.settlement_deadline ? new Date(e.settlement_deadline) : null;
                      const isPastDeadline = deadlineDate && deadlineDate < now;
                      const daysUntilDeadline = deadlineDate
                        ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      const deadlineSoon = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
                      const deadlineColor = isPastDeadline
                        ? "text-red-600 font-medium"
                        : deadlineSoon
                          ? "text-amber-600 font-medium"
                          : "text-muted-foreground";
                      return (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate max-w-[180px]">
                                {e.name ?? "Untitled"}
                              </span>
                              <Badge
                                className={cn(
                                  "text-xs hidden sm:inline-flex shrink-0",
                                  statusColors[e.status] ?? "bg-gray-100 text-gray-600",
                                )}
                              >
                                {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                            {e.start
                              ? new Date(e.start).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell whitespace-nowrap">
                            {e.settlement_deadline ? (
                              <span className={cn(deadlineColor)}>
                                {new Date(e.settlement_deadline).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            ${(e.total_gross / 100).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell whitespace-nowrap">
                            {e.unsettled_amount > 0 ? (
                              <span className="text-amber-600 font-medium">
                                ${(e.unsettled_amount / 100).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-green-600 text-xs">Settled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => router.push(`/dashboard/payments/${e.id}`)}
                            >
                              Manage
                              <ArrowRight className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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
