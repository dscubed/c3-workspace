"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { ClubResult } from "@/components/clubs/ClubSearchInput";
import { colors } from "./tokens";

interface AccountSetupProps {
  club: ClubResult;
  prefilledEmail: string;
}

function pwdTests(pw: string) {
  return {
    min: pw.length >= 8,
    letter: /[a-zA-Z]/.test(pw),
    number: /\d/.test(pw),
  };
}

function pwdValid(pw: string) {
  const t = pwdTests(pw);
  return t.min && t.letter && t.number;
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function AccountSetup({ club, prefilledEmail }: AccountSetupProps) {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(() => pwdTests(password), [password]);
  const pwOk = pwdValid(password);
  const confirmTouched = confirm.length > 0;
  const match = password === confirm;
  const canSubmit = pwOk && match && email.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const body = await fetchJson("/api/admin/onboarding/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id, email: email.trim(), password }),
      });
      window.location.href = body.data.magicLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col items-center gap-5 pt-4"
    >
      <div
        className="w-full rounded-2xl p-6 text-left"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 20px rgba(167,139,250,0.05)",
        }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.tint }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
        </div>
        <h3 className="font-fredoka text-base font-semibold text-slate-700 mb-1 text-center">
          You are now verified
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
          You&apos;re one step away from accessing your Connect3 account. Input your preferred email and set your password — you can change this later.
        </p>

        {/* Email */}
        <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={prefilledEmail}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 mb-4"
          style={{
            borderColor: colors.border,
            background: colors.tint,
            color: "#1e1b4b",
          }}
        />

        {/* Password */}
        <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 mb-2.5"
          style={{
            borderColor: password.length > 0 ? (pwOk ? "#86efac" : "#fca5a5") : colors.border,
            background: colors.tint,
            color: "#1e1b4b",
          }}
        />

        {password.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-4 text-[11px]">
            <span className="inline-flex items-center gap-1" style={{ color: checks.min ? "#4ade80" : "#f87171" }}>
              {checks.min ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              8+ characters
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: checks.letter ? "#4ade80" : "#f87171" }}>
              {checks.letter ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              One letter
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: checks.number ? "#4ade80" : "#f87171" }}>
              {checks.number ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              One number
            </span>
          </div>
        )}

        {/* Confirm password */}
        <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>
          Confirm password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 mb-2"
          style={{
            borderColor: confirmTouched ? (match ? "#86efac" : "#fca5a5") : colors.border,
            background: colors.tint,
            color: "#1e1b4b",
          }}
        />

        {confirmTouched && !match && (
          <p className="text-xs mb-3" style={{ color: "#f87171" }}>
            Passwords don&apos;t match
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="group w-full py-3 rounded-xl font-fredoka font-semibold text-base flex items-center justify-center gap-2 transition-all duration-250 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
          boxShadow: `0 3px 14px rgba(167,139,250,0.22)`,
          color: "white",
        }}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Confirm and continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
      </button>
    </motion.div>
  );
}
