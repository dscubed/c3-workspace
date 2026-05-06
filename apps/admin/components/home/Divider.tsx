"use client";

import { colors } from "./tokens";

export function Divider() {
  return (
    <div
      className="w-10 h-px rounded-full"
      style={{
        background: `linear-gradient(90deg, transparent, ${colors.soft}, transparent)`,
      }}
    />
  );
}
