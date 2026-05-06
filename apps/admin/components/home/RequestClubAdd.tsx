"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { colors } from "../home/tokens";

const universities = [
  { value: "unimelb", label: "University of Melbourne" },
  { value: "custom", label: "Other (specify below)" },
];

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function RequestClubAdd() {
  const [clubName, setClubName] = useState("");
  const [clubEmail, setClubEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [university, setUniversity] = useState("unimelb");
  const [customUni, setCustomUni] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = clubName.trim() && clubEmail.trim() && (university !== "custom" || customUni.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await fetchJson("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club_not_listed",
          data: {
            club_name: clubName.trim(),
            club_email: clubEmail.trim(),
            instagram: instagram.trim(),
            university: university === "custom" ? customUni.trim() : "University of Melbourne",
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
        <p className="font-fredoka text-base font-semibold text-slate-600">Request received!</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Thanks for reaching out! We&apos;ll review your club and get back to you within 3–4 business days. A confirmation has been sent to your email.
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
        <h3 className="font-fredoka text-base font-semibold text-slate-700 mb-1 text-center">Don&apos;t see your club?</h3>
        <p className="text-xs text-slate-400 text-center mb-4">
          No worries — we&apos;re adding new clubs all the time. Drop your details below and we&apos;ll get you set up on Connect3.
        </p>

        <input
          placeholder="Club name"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />
        <input
          type="email"
          placeholder="Club email"
          value={clubEmail}
          onChange={(e) => setClubEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />
        <input
          placeholder="Instagram (optional)"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        />

        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3 appearance-none"
          style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
        >
          {universities.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>

        {university === "custom" && (
          <input
            placeholder="Your university"
            value={customUni}
            onChange={(e) => setCustomUni(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-3"
            style={{ borderColor: colors.border, background: colors.tint, color: "#1e1b4b" }}
          />
        )}
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
          <>Submit request <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" /></>
        )}
      </button>
    </motion.div>
  );
}
