"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeId: string;
  eventName: string;
}

export function QRCodeDialog({
  open,
  onOpenChange,
  qrCodeId,
  eventName,
}: QRCodeDialogProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const url = `${SITE_URL}/api/checkin/${qrCodeId}`;
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).then(setDataUrl);
  }, [open, qrCodeId]);

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
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Check-in QR Code"
              width={280}
              height={280}
              className="rounded-lg"
            />
          ) : (
            <div className="w-70 h-70 rounded-lg bg-gray-100 animate-pulse" />
          )}
          <p className="text-xs text-muted-foreground text-center">
            Present this at the door for check-in
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
