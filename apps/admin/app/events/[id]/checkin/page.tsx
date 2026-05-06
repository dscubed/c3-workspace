"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { QRScanner, type ScanResult } from "@/components/qr/QRScanner";

export default function CheckinScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const [checkedInCount, setCheckedInCount] = useState(0);

  const handleScan = useCallback(
    async (raw: string): Promise<ScanResult> => {
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });

        const body = await res.json();

        if (res.status === 409) {
          return {
            success: false,
            title: "Already Checked In",
            message: body.name ?? "This ticket was already scanned.",
          };
        }

        if (!res.ok) {
          return {
            success: false,
            title: "Error",
            message: body.error ?? "Something went wrong.",
          };
        }

        setCheckedInCount((n) => n + 1);

        return {
          success: true,
          title: "Checked In",
          message: body.name,
          data: {
            Event: body.event_name,
            Email: body.email,
          },
        };
      } catch {
        return {
          success: false,
          title: "Network Error",
          message: "Could not reach server.",
        };
      }
    },
    [],
  );

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button
          onClick={() => router.push(`/dashboard/events/${eventId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="size-4" />
          {checkedInCount} checked in this session
        </div>
      </div>

      {/* Scanner */}
      <div className="flex-1 overflow-hidden">
        <QRScanner onScan={handleScan} title="Scan attendee ticket" />
      </div>
    </div>
  );
}
