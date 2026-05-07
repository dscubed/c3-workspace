"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, DollarSign, Ticket, AlertTriangle, RefreshCw, Lock, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn, fetcher } from "@c3/utils";
import useSWR from "swr";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  is_creator: boolean;
}

interface TierBreakdown {
  id: string;
  name: string;
  capacity: number | null;
  sold: number;
  revenue: number;
  settled: number;
  unsettled: number;
}

interface SplitData {
  id?: string;
  club_id: string;
  percentage: number;
  created_at?: string;
  profile?: { first_name: string | null; avatar_url: string | null } | null;
}

interface AgreementData {
  club_id: string;
  agreed_at: string;
  split_snapshot: { club_id: string; percentage: number }[];
}

interface TransactionRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tier_name: string | null;
  amount_total: number;
  payout_settled: boolean;
  created_at: string;
  stripe_session_id: string | null;
}

interface EventPaymentStats {
  event: {
    id: string;
    name: string | null;
    start: string | null;
    end: string | null;
    status: string;
    creator_profile_id: string;
  };
  current_user_is_creator: boolean;
  stats: {
    total_sold: number;
    total_gross: number;
    estimated_fees: number;
    estimated_net: number;
    settled_amount: number;
    unsettled_amount: number;
    tier_breakdown: TierBreakdown[];
  };
  splits: SplitData[];
  collaborators: Collaborator[];
  settlement_deadline: string | null;
  agreements: AgreementData[];
  all_agreed: boolean;
  last_payout_at: string | null;
}

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function EventPaymentsPage({
  params,
}: {
  params: Promise<{ eventid: string }>;
}) {
  const { eventid } = use(params);
  const router = useRouter();

  const { data, isLoading, mutate } = useSWR<EventPaymentStats>(
    `/api/admin/events/${eventid}/stats`,
    fetcher,
  );
  const [resyncing, setResyncing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push("/dashboard/events")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </button>
        <p className="text-muted-foreground">Event not found or access denied.</p>
      </div>
    );
  }

  const { event, stats, splits, collaborators, settlement_deadline, agreements, all_agreed, last_payout_at } = data;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <button
        onClick={() => router.push("/dashboard/events")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{event.name ?? "Untitled"}</h1>
          <Badge className={cn(statusColors[event.status])}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={resyncing}
          onClick={async () => {
            setResyncing(true);
            try {
              const res = await fetch(
                `/api/admin/events/${event.id}/resync-stripe`,
                { method: "POST" },
              );
              const body = await res.json();
              if (!res.ok) {
                toast.error(body.error ?? "Resync failed");
              } else {
                toast.success(`Synced ${body.data.synced} tiers`);
              }
            } catch {
              toast.error("Network error");
            } finally {
              setResyncing(false);
            }
          }}
        >
          <RefreshCw className={`size-4 mr-1.5 ${resyncing ? "animate-spin" : ""}`} />
          {resyncing ? "Syncing..." : "Resync Stripe"}
        </Button>
      </div>
      {event.start && (
        <p className="text-sm text-muted-foreground -mt-4">
          {new Date(event.start).toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Ticket className="size-4" />
            Tickets Sold
          </div>
          <p className="text-3xl font-bold">{stats.total_sold}</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="size-4" />
            Gross Revenue
          </div>
          <p className="text-3xl font-bold">${(stats.total_gross / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CreditCard className="size-4" />
            Est. Fees
          </div>
          <p className="text-3xl font-bold">${(stats.estimated_fees / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="size-4" />
            Est. Net
          </div>
          <p className="text-3xl font-bold text-green-600">${(stats.estimated_net / 100).toFixed(2)}</p>
        </div>
      </div>

      {stats.tier_breakdown.length > 0 && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Per-Tier Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sold</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Capacity</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.tier_breakdown.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-right">{t.sold}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{t.capacity ?? "∞"}</td>
                    <td className="px-4 py-3 text-right">${(t.revenue / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransactionsSection eventId={event.id} />

      <SplitsSection
        eventId={event.id}
        collaborators={collaborators}
        currentSplits={splits}
        agreements={agreements}
        allAgreed={all_agreed}
        netAmount={stats.estimated_net}
        onSplitsUpdated={() => mutate()}
      />

      <PayoutSection
        eventId={event.id}
        netAmount={stats.estimated_net}
        unsettledAmount={stats.unsettled_amount}
        splits={splits}
        collaborators={collaborators}
        totalSold={stats.total_sold}
        lastPayoutAt={last_payout_at}
        settlementDeadline={settlement_deadline}
        allAgreed={all_agreed}
        onPayoutComplete={() => mutate()}
      />
    </div>
  );
}

function TransactionsSection({ eventId }: { eventId: string }) {
  const { data, isLoading } = useSWR<TransactionRow[]>(
    `/api/admin/events/${eventId}/transactions`,
    fetcher,
  );

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ["Date", "Customer", "Email", "Tier", "Amount", "Status"];
    const rows = data.map((r) => [
      new Date(r.created_at).toLocaleDateString("en-AU"),
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—",
      r.email ?? "—",
      r.tier_name ?? "—",
      `$${((r.amount_total ?? 0) / 100).toFixed(2)}`,
      r.payout_settled ? "Settled" : "Unsettled",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Skeleton className="h-32 rounded-lg" />;
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Transactions</h2>
        <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1 h-7 text-xs">
          <Download className="size-3" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tier</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr
                key={r.id}
                className={cn("border-b last:border-0", r.payout_settled && "opacity-60")}
              >
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.tier_name ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${((r.amount_total ?? 0) / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {r.payout_settled ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Settled</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Unsettled</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SplitsSection({
  eventId,
  collaborators,
  currentSplits,
  agreements,
  allAgreed,
  netAmount,
  onSplitsUpdated,
}: {
  eventId: string;
  collaborators: Collaborator[];
  currentSplits: SplitData[];
  agreements: AgreementData[];
  allAgreed: boolean;
  netAmount: number;
  onSplitsUpdated: () => void;
}) {
  const [editing, setEditing] = useState(currentSplits.length === 0);
  const [localSplits, setLocalSplits] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>();
    if (currentSplits.length > 0) {
      for (const s of currentSplits) {
        m.set(s.club_id, s.percentage);
      }
    } else if (collaborators.length === 1) {
      m.set(collaborators[0]!.id, 100);
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [agreeing, setAgreeing] = useState<string | null>(null);

  const sum = Array.from(localSplits.values()).reduce((a, b) => a + b, 0);

  const agreedClubIds = new Set(agreements.map((a) => a.club_id));

  const handleSave = async () => {
    const splits = collaborators
      .filter((c) => localSplits.has(c.id))
      .map((c) => ({ club_id: c.id, percentage: localSplits.get(c.id)! }));

    if (splits.length === 0) {
      toast.error("Add at least one collaborator to the split");
      return;
    }

    if (Math.abs(sum - 100) > 0.01) {
      toast.error(`Split percentages must sum to 100 (currently ${sum})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/splits`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splits }),
      });
      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Failed to save splits");
        return;
      }
      toast.success("Splits proposed — all agreements reset");
      setEditing(false);
      onSplitsUpdated();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAgree = async () => {
    setAgreeing("self");
    try {
      const res = await fetch(`/api/admin/events/${eventId}/splits/agree`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Failed to agree");
        return;
      }
      toast.success("You agreed to the split");
      onSplitsUpdated();
    } catch {
      toast.error("Network error");
    } finally {
      setAgreeing(null);
    }
  };

  const handleStartEditing = () => {
    if (agreements.length > 0) {
      toast("Editing splits will reset all agreements", { description: "All parties will need to agree again." });
    }
    setEditing(true);
  };

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Revenue Splits</h2>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              sum === 100
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200",
            )}
          >
            Sum: {sum}%
          </Badge>
          {!editing && !allAgreed && currentSplits.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleStartEditing} className="h-7 text-xs">
              Edit
            </Button>
          )}
        </div>
      </div>

      {allAgreed && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-200 flex items-center gap-2 text-sm text-green-700">
          <Lock className="size-3.5" />
          All parties agreed — payout is unlocked
        </div>
      )}

      <div className="p-4 space-y-3">
        {collaborators.map((c) => {
          const pct = localSplits.get(c.id) ?? 0;
          const canSplit = c.stripe_account_id && c.stripe_charges_enabled;
          const estimatedAmount = netAmount > 0 ? Math.floor(netAmount * (pct / 100)) : 0;
          const hasAgreed = agreedClubIds.has(c.id);

          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {c.first_name ?? "Unknown"}
                  </span>
                  {c.is_creator && (
                    <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200">Creator</Badge>
                  )}
                  {canSplit ? (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Connected</Badge>
                  ) : (
                    <Badge className="text-xs bg-red-100 text-red-700 border-red-200" title="Must connect Stripe before being added to splits">
                      No Stripe
                    </Badge>
                  )}
                  {!editing && currentSplits.length > 0 && (
                    hasAgreed ? (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                        <Check className="size-2.5" />
                        Agreed
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )
                  )}
                </div>
                {!canSplit && editing && (
                  <p className="text-xs text-red-500 mt-0.5">Must connect Stripe before being added to splits</p>
                )}
                {canSplit && estimatedAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">Est. payout: ${(estimatedAmount / 100).toFixed(2)}</p>
                )}
              </div>
              {editing ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={pct || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setLocalSplits((prev) => {
                      const next = new Map(prev);
                      if (val <= 0) {
                        next.delete(c.id);
                      } else {
                        next.set(c.id, Math.min(100, val));
                      }
                      return next;
                    });
                  }}
                  placeholder="0"
                  className="h-8 w-20 text-sm"
                  disabled={saving}
                />
              ) : (
                <span className="text-sm font-medium w-20 text-right tabular-nums">{pct}%</span>
              )}
            </div>
          );
        })}

        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No collaborators yet.
          </p>
        )}

        <div className="border-t pt-3 flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Propose Splits"}
              </Button>
              {currentSplits.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    if (currentSplits.length > 0) {
                      const m = new Map<string, number>();
                      for (const s of currentSplits) {
                        m.set(s.club_id, s.percentage);
                      }
                      setLocalSplits(m);
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : (
            currentSplits.length > 0 &&
            !allAgreed && (
              <Button
                size="sm"
                onClick={handleAgree}
                disabled={agreeing === "self"}
              >
                {agreeing === "self" ? "Agreeing..." : "Agree to this split"}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function PayoutSection({
  eventId,
  netAmount,
  unsettledAmount,
  splits,
  collaborators,
  totalSold,
  lastPayoutAt,
  settlementDeadline,
  allAgreed,
  onPayoutComplete,
}: {
  eventId: string;
  netAmount: number;
  unsettledAmount: number;
  splits: SplitData[];
  collaborators: Collaborator[];
  totalSold: number;
  lastPayoutAt: string | null;
  settlementDeadline: string | null;
  allAgreed: boolean;
  onPayoutComplete: () => void;
}) {
  const [payouting, setPayouting] = useState(false);
  const splitMap = new Map(splits.map((s) => [s.club_id, s.percentage]));

  const now = new Date();
  const deadlineDate = settlementDeadline ? new Date(settlementDeadline) : null;
  const isPastDeadline = deadlineDate ? deadlineDate < now : false;
  const daysUntilDeadline = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const splitParties = splits.map((s) => s.club_id);
  const hasSplits = splits.length > 0;

  const canPayout =
    totalSold > 0 &&
    unsettledAmount > 0 &&
    (!hasSplits || allAgreed) &&
    collaborators.every((c) => {
      if (!hasSplits) return true;
      if (!splitParties.includes(c.id)) return true;
      return c.stripe_account_id && c.stripe_charges_enabled;
    }) &&
    (splits.length === 0 || Math.abs(Array.from(splitMap.values()).reduce((a, b) => a + b, 0) - 100) < 0.01);

  const handlePayout = async () => {
    setPayouting(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/payout`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Payout failed");
        return;
      }
      toast.success(
        `Funds transferred — arrival depends on Stripe payout schedule`,
      );
      onPayoutComplete();
    } catch {
      toast.error("Network error");
    } finally {
      setPayouting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Payout</h2>
      </div>
      <div className="p-4 space-y-3">
        {lastPayoutAt && (
          <p className="text-xs text-muted-foreground">
            Last payout: {new Date(lastPayoutAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {settlementDeadline && (
          <div
            className={cn(
              "flex items-center gap-2 text-xs rounded px-3 py-2 border",
              isPastDeadline
                ? "text-red-600 bg-red-50 border-red-200"
                : daysUntilDeadline !== null && daysUntilDeadline <= 7
                  ? "text-amber-600 bg-amber-50 border-amber-200"
                  : "text-muted-foreground bg-gray-50 border-gray-200",
            )}
          >
            {isPastDeadline ? (
              <AlertTriangle className="size-3.5 shrink-0" />
            ) : null}
            <span>
              {isPastDeadline
                ? "Settlement overdue"
                : `Settle by ${deadlineDate!.toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} (${daysUntilDeadline}d remaining)`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Unsettled revenue</span>
          <span className="font-medium">${(unsettledAmount / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Est. net after fees</span>
          <span className="font-medium">${(netAmount / 100).toFixed(2)}</span>
        </div>

        {hasSplits && !allAgreed && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              Waiting for all parties to agree on the revenue split before payout can be triggered.
            </span>
          </div>
        )}

        {!canPayout && totalSold > 0 && allAgreed && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              {unsettledAmount === 0
                ? "All revenue has been settled"
                : "Ensure all collaborators have completed Stripe onboarding and splits sum to 100%"}
            </span>
          </div>
        )}

        <Button
          onClick={handlePayout}
          disabled={!canPayout || payouting}
          className="w-full"
        >
          {payouting ? "Processing..." : "Send Payout"}
        </Button>
      </div>
    </div>
  );
}
