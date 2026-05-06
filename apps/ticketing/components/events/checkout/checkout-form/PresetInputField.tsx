"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ThemeColors } from "@/components/events/shared";

interface PresetInputFieldProps {
  label: string;
  fieldKey: string;
  type: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  colors: ThemeColors;
  disabled?: boolean;
}

export function PresetInputField({
  label,
  fieldKey,
  type,
  required,
  value,
  onChange,
  colors,
  disabled,
}: PresetInputFieldProps) {
  return (
    <div className={cn("space-y-1.5", fieldKey === "email" && "sm:col-span-2")}>
      <Label className={cn("text-sm font-medium", colors.text)}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        placeholder={label}
        disabled={disabled}
        className={cn(colors.inputBg, colors.inputBorder, colors.placeholder)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
