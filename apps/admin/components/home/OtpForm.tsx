"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { colors } from "./tokens";

interface OtpFormProps {
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  verifying: boolean;
  resending: boolean;
  verifyError: string | null;
}

export function OtpForm({
  onVerify,
  onResend,
  onBack,
  verifying,
  resending,
  verifyError,
}: OtpFormProps) {
  const [digits, setDigits] = useState<string[]>(new Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6) onVerify(code);
  }, [digits, onVerify]);

  const handleChange = useCallback(
    (i: number, val: string) => {
      if (!/^\d?$/.test(val)) return;
      const next = [...digits];
      next[i] = val;
      setDigits(next);
      if (val && i < 5) refs.current[i + 1]?.focus();
    },
    [digits],
  );

  const handleKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[i] && i > 0) {
        refs.current[i - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = new Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div
        className="w-full rounded-2xl p-6 text-center"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 20px rgba(167,139,250,0.05)",
        }}
      >
        <p className="text-sm text-slate-500 mb-5">
          Enter the verification code sent to your email
        </p>

        <div className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              maxLength={1}
              inputMode="numeric"
              autoComplete="off"
              value={d}
              disabled={verifying}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 rounded-xl border text-center text-lg font-mono outline-none transition-all duration-150 disabled:opacity-50"
              style={{
                borderColor: d ? colors.accent : colors.border,
                color: colors.accent,
                background: colors.tint,
                boxShadow: d ? `0 0 0 2px ${colors.ring}` : "none",
              }}
            />
          ))}
        </div>

        {verifying && (
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: colors.soft }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying…
          </div>
        )}

        {verifyError && (
          <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>{verifyError}</p>
        )}

        <button
          onClick={onResend}
          disabled={resending}
          className="text-xs font-medium transition-opacity duration-150 hover:opacity-70 disabled:opacity-50 mt-3"
          style={{ color: colors.soft }}
        >
          {resending ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Resending…
            </span>
          ) : (
            "Resend verification"
          )}
        </button>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
        style={{ color: colors.soft }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Change email
      </button>
    </div>
  );
}
