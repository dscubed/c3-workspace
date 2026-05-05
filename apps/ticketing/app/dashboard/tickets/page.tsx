"use client";

import { useState } from "react";
import { QrCode, Receipt, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRegistrations,
  useActiveRegistrations,
} from "@/lib/hooks/useRegistrations";
import { RegistrationRow } from "@/components/tickets/RegistrationRow";
import { OrderRow } from "@/components/tickets/OrderRow";
import type { RegistrationWithEvent } from "@c3/types";

type Tab = "all" | "active" | "orders" | "refunds";

const pills: { label: string; value: Tab }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Orders", value: "orders" },
  { label: "Refunds", value: "refunds" },
];

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <Icon className="h-9 w-9 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function RegistrationListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function RegistrationList({
  registrations,
  isLoading,
  emptyIcon,
  emptyText,
}: {
  registrations: RegistrationWithEvent[];
  isLoading: boolean;
  emptyIcon: React.ElementType;
  emptyText: string;
}) {
  if (isLoading) return <RegistrationListSkeleton />;
  if (registrations.length === 0)
    return <EmptyState icon={emptyIcon} text={emptyText} />;
  return (
    <div className="divide-y">
      {registrations.map((r) => (
        <RegistrationRow key={r.id} registration={r} />
      ))}
    </div>
  );
}

function AllTab({ onSeeMore }: { onSeeMore: (tab: Tab) => void }) {
  const { registrations: active, isLoading } = useActiveRegistrations();
  const { registrations: all } = useRegistrations();

  return (
    <div className="space-y-4">
      {/* Active tickets section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Active Tickets
          </h2>
          {active.length > 0 && (
            <button
              onClick={() => onSeeMore("active")}
              className="text-xs text-[#854ECB] font-medium hover:underline"
            >
              See all ({active.length})
            </button>
          )}
        </div>
        <RegistrationList
          registrations={active.slice(0, 3)}
          isLoading={isLoading}
          emptyIcon={QrCode}
          emptyText="Your active tickets will appear here"
        />
      </div>

      {/* Order history section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Order History
          </h2>
          {all.length > 0 && (
            <button
              onClick={() => onSeeMore("orders")}
              className="text-xs text-[#854ECB] font-medium hover:underline"
            >
              See all ({all.length})
            </button>
          )}
        </div>
        {isLoading ? (
          <OrderListSkeleton />
        ) : all.length === 0 ? (
          <EmptyState icon={Receipt} text="Your order history will appear here" />
        ) : (
          <div className="divide-y">
            {all.slice(0, 3).map((r) => (
              <OrderRow key={r.id} registration={r} />
            ))}
          </div>
        )}
      </div>

      {/* Refunds section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-foreground">Refunds</h2>
        </div>
        <EmptyState icon={RotateCcw} text="No refund requests" />
      </div>
    </div>
  );
}

function ActiveTab() {
  const { registrations, isLoading } = useActiveRegistrations();

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-foreground">
          Active Tickets
        </h2>
      </div>
      <RegistrationList
        registrations={registrations}
        isLoading={isLoading}
        emptyIcon={QrCode}
        emptyText="Your active tickets will appear here"
      />
    </div>
  );
}

function OrdersTab() {
  const { registrations, isLoading } = useRegistrations();

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-foreground">Order History</h2>
      </div>
      {isLoading ? (
        <OrderListSkeleton />
      ) : registrations.length === 0 ? (
        <EmptyState icon={Receipt} text="Your order history will appear here" />
      ) : (
        <div className="divide-y">
          {registrations.map((r) => (
            <OrderRow key={r.id} registration={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RefundsTab() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-foreground">Refunds</h2>
      </div>
      <EmptyState icon={RotateCcw} text="No refund requests" />
    </div>
  );
}

export default function TicketsPage() {
  const [tab, setTab] = useState<Tab>("all");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tickets</h1>
      </div>

      {/* Pills */}
      <div className="flex items-center gap-2">
        {pills.map((p) => (
          <button
            key={p.value}
            onClick={() => setTab(p.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              tab === p.value
                ? "bg-[#854ECB] text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-black",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "all" && <AllTab onSeeMore={setTab} />}
      {tab === "active" && <ActiveTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "refunds" && <RefundsTab />}
    </div>
  );
}
