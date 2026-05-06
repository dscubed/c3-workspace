"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { colors } from "../home/tokens";

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function ReportIncorrectEmail({ handleBack }: { handleBack: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [correctEmail, setCorrectEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = firstName.trim() && lastName.trim() && correctEmail.trim() && role.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await fetchJson("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email_incorrect",
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role.trim(),
            correct_email: correctEmail.trim(),
          },
        }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center gap-3 py-4"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: colors.tint }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <p className="font-fredoka text-base font-semibold text-slate-600">Correction submitted</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Thanks for letting us know! We&apos;ll verify your details and get back to you within 3–4 business days. A confirmation has been sent to your email.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center gap-4"
    >
      <div
        className="w-full rounded-2xl p-5 text-left"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 20px rgba(167,139,250,0.05)",
        }}
      >
        <h3 className="font-fredoka text-base font-semibold text-slate-700 mb-1 text-center">Email looks wrong?</h3>
        <p className="text-xs text-slate-400 text-center mb-4">
          Fill in your correct details below, we&apos;ll verify and update your club info within 3–4 business days.
        </p>

        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />
        <input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger
            className="w-full h-auto px-4 py-2.5 rounded-xl text-sm mb-3 !border !shadow-none !outline-none"
            style={{
              background: colors.tint,
              borderColor: colors.border,
              color: role ? "#1e1b4b" : "#94a3b8",
            }}
          >
            <SelectValue placeholder="Your role in the club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="President">President</SelectItem>
            <SelectItem value="Vice President">Vice President</SelectItem>
            <SelectItem value="Secretary">Secretary</SelectItem>
            <SelectItem value="Treasurer">Treasurer</SelectItem>
            <SelectItem value="Committee Member">Committee Member</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="email"
          placeholder="Correct email address"
          value={correctEmail}
          onChange={(e) => setCorrectEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />

        <button
          onClick={handleBack}
          className="mt-4 pl-2 flex items-center text-sm font-fredoka gap-1 transition-opacity hover:opacity-70"
          style={{ color: colors.soft }}
        >
          Back to verification
        </button>

      </div>

      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}

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
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>Send correction <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" /></>
        )}
      </button>
    </motion.div>
  );
}
