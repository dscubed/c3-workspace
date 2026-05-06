"use client";

import { colors } from "./tokens";
import { Divider } from "./Divider";

export interface ExecutiveQuestionProps {
  onChoice: (isExec: boolean) => void;
}

export function ExecutiveQuestion({ onChoice }: ExecutiveQuestionProps) {
  return (
    <div className="anim-fade-up w-full flex flex-col items-center gap-5">
      <Divider />
      <p className="font-fredoka text-xl font-medium text-slate-500">
        Are you a club executive?
      </p>
      <div className="flex gap-3 w-full">
        <button
          id="exec-yes-btn"
          onClick={() => onChoice(true)}
          className="group flex-1 relative py-3 px-6 rounded-2xl font-fredoka font-semibold text-lg overflow-hidden transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
            boxShadow: `0 3px 14px rgba(167,139,250,0.22), 0 1px 3px rgba(0,0,0,0.08)`,
            color: "white",
          }}
        >
          <span className="relative z-10">Yes ✓</span>
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
            }}
          />
        </button>

        <button
          id="exec-no-btn"
          onClick={() => onChoice(false)}
          className="flex-1 py-3 px-6 rounded-2xl font-fredoka font-semibold text-lg border transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
          style={{
            borderColor: colors.border,
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(8px)",
            color: "#a78bfa",
            boxShadow: `0 1px 6px rgba(167,139,250,0.06)`,
          }}
        >
          No
        </button>
      </div>
    </div>
  );
}
