"use client";

import { useState } from "react";
import { QrCode, Receipt, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "orders" | "refunds";

const pills: { label: string; value: Tab }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Orders", value: "orders" },
  { label: "Refunds", value: "refunds" },
];

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <Icon className="h-9 w-9 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  emptyText: string;
  onSeeMore: () => void;
}

function SectionCard({ title, icon, emptyText, onSeeMore }: SectionCardProps) {
  const hasItems = false; // replace with real data check

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hasItems && (
          <button
            onClick={onSeeMore}
            className="text-xs text-[#854ECB] font-medium hover:underline"
          >
            See more
          </button>
        )}
      </div>
      <EmptyState icon={icon} text={emptyText} />
    </div>
  );
}

function AllTab({ onSeeMore }: { onSeeMore: (tab: Tab) => void }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Active Tickets"
        icon={QrCode}
        emptyText="Your tickets will appear here"
        onSeeMore={() => onSeeMore("active")}
      />
      <SectionCard
        title="Order History"
        icon={Receipt}
        emptyText="Your order history will appear here"
        onSeeMore={() => onSeeMore("orders")}
      />
      <SectionCard
        title="Refunds"
        icon={RotateCcw}
        emptyText="No refund requests"
        onSeeMore={() => onSeeMore("refunds")}
      />
    </div>
  );
}

function ActiveTab() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-foreground">Active Tickets</h2>
      </div>
      <EmptyState icon={QrCode} text="Your tickets will appear here" />
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-foreground">Order History</h2>
      </div>
      <EmptyState icon={Receipt} text="Your order history will appear here" />
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
