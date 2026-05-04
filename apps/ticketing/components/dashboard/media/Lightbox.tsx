"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface LightboxProps {
  total: number;
  startIndex: number;
  onClose: () => void;
  className?: string;
  children: (idx: number) => React.ReactNode;
}

export function Lightbox({
  total,
  startIndex,
  onClose,
  className,
  children,
}: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [total, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center ${className ?? ""}`}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {children(idx)}

      {idx < total - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i + 1);
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
        {idx + 1} / {total}
      </p>
    </div>
  );
}
