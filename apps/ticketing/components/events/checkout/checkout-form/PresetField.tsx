"use client";

import type { ThemeColors } from "@/components/events/shared";
import type { getPresetFields } from "@/lib/types/ticketing";
import { YesNoField } from "./YesNoField";
import { PresetInputField } from "./PresetInputField";

type PresetFieldDef = ReturnType<typeof getPresetFields>[number];

interface PresetFieldProps {
  field: PresetFieldDef;
  value: string;
  onChange: (val: string) => void;
  isDark: boolean;
  colors: ThemeColors;
  disabled?: boolean;
}

export function PresetField({ field, value, onChange, isDark, colors, disabled }: PresetFieldProps) {
  if (field.type === "yesno") {
    return (
      <YesNoField
        label={field.label}
        value={value}
        onChange={onChange}
        isDark={isDark}
        colors={colors}
        disabled={disabled}
      />
    );
  }

  return (
    <PresetInputField
      label={field.label}
      fieldKey={field.key}
      type={field.type}
      required={field.required}
      value={value}
      onChange={onChange}
      colors={colors}
      disabled={disabled}
    />
  );
}
