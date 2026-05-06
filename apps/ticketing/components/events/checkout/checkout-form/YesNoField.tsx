"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ThemeColors } from "@/components/events/shared";

interface YesNoFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isDark: boolean;
  colors: ThemeColors;
  disabled?: boolean;
}

export function YesNoField({ label, value, onChange, isDark, colors, disabled }: YesNoFieldProps) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label className={cn("text-sm font-medium", colors.text)}>
        {label}
        <span className="ml-0.5 text-red-500">*</span>
      </Label>
      <div className="flex gap-3">
        {["Yes", "No"].map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-lg border px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              value === opt
                ? isDark
                  ? "border-white bg-white text-black"
                  : "border-black bg-black text-white"
                : cn(colors.inputBg, colors.inputBorder, colors.text),
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
