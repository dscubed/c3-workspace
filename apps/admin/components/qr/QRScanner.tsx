"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { CheckCircle, XCircle, Camera, CameraOff } from "lucide-react";

export interface ScanResult {
  success: boolean;
  title: string;
  message: string;
  data?: Record<string, string | null>;
}

interface QRScannerProps {
  onScan: (raw: string) => Promise<ScanResult>;
  title?: string;
  resumeDelayMs?: number;
}

type OverlayState =
  | { type: "idle" }
  | { type: "scanning" }
  | { type: "result"; result: ScanResult };

export function QRScanner({
  onScan,
  title = "Scan QR Code",
  resumeDelayMs = 2000,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [overlay, setOverlay] = useState<OverlayState>({ type: "idle" });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not available. Open this page over HTTPS.");
      setOverlay({ type: "idle" });
      return;
    }

    setOverlay({ type: "scanning" });
    setError(null);

    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, err) => {
          if (!result || processingRef.current) return;
          processingRef.current = true;

          controlsRef.current?.stop();

          const scanResult = await onScan(result.getText());
          setOverlay({ type: "result", result: scanResult });

          setTimeout(() => {
            processingRef.current = false;
            setOverlay({ type: "scanning" });
            startScanning();
          }, resumeDelayMs);
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setPermissionDenied(true);
      } else {
        setError(msg);
      }
      setOverlay({ type: "idle" });
    }
  }, [onScan, resumeDelayMs]);

  useEffect(() => {
    startScanning();
    return () => {
      controlsRef.current?.stop();
    };
  }, [startScanning]);

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <CameraOff className="size-12 text-muted-foreground" />
        <p className="font-medium">Camera permission denied</p>
        <p className="text-sm text-muted-foreground">
          Allow camera access in your browser settings, then reload.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Targeting reticle */}
        {overlay.type === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-56">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br" />
            </div>
          </div>
        )}

        {/* Result overlay */}
        {overlay.type === "result" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl text-center">
              {overlay.result.success ? (
                <CheckCircle className="size-12 text-green-500 mx-auto mb-3" />
              ) : (
                <XCircle className="size-12 text-red-500 mx-auto mb-3" />
              )}
              <p className="font-semibold text-lg">{overlay.result.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{overlay.result.message}</p>
              {overlay.result.data &&
                Object.entries(overlay.result.data).map(([k, v]) =>
                  v ? (
                    <p key={k} className="text-sm mt-1">
                      <span className="text-muted-foreground">{k}: </span>
                      {v}
                    </p>
                  ) : null,
                )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6">
            <div className="bg-white rounded-xl p-4 text-center max-w-xs">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
