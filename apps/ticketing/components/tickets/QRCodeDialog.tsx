"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQRCode } from "@/lib/hooks/useQRCode";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationId: string;
  eventName: string;
}

export function QRCodeDialog({
  open,
  onOpenChange,
  registrationId,
  eventName,
}: QRCodeDialogProps) {
  const { dataUrl, isLoading, regenerate } = useQRCode(registrationId, open);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Your QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm text-muted-foreground text-center">
            {eventName}
          </p>
          {isLoading || !dataUrl ? (
            <div className="w-[280px] h-[280px] rounded-lg bg-gray-100 animate-pulse" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Check-in QR Code"
              width={280}
              height={280}
              className="rounded-lg"
            />
          )}
          <p className="text-xs text-muted-foreground text-center">
            Present this at the door for check-in
          </p>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`size-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate QR"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Regenerating invalidates the old QR code immediately.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
