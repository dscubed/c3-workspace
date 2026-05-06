"use client";

import { useState, useEffect } from "react";
import { LogoAnimated, Logo, UserAvatar } from "@c3/ui";
import { ArrowRight, HelpCircle, Building2, X } from "lucide-react";
import { ClubSearchInput, type ClubResult } from "@/components/clubs/ClubSearchInput";

/* ─────────────────────────── shared tokens ─────────────────────────── */

const colors = {
  /** light violet ring/focus colour */
  ring: "rgba(167,139,250,0.35)",
  /** mid violet — buttons, text */
  accent: "#7c3aed",
  /** softer - borders, icons */
  soft: "#a78bfa",
  /** very light tint  */
  tint: "#f5f3ff",
  /** border between elements */
  border: "#ede9fe",
};

/* ─────────────────────────── tiny primitives ───────────────────────── */

function Divider() {
  return (
    <div
      className="w-10 h-px rounded-full"
      style={{
        background: `linear-gradient(90deg, transparent, ${colors.soft}, transparent)`,
      }}
    />
  );
}

/* ─────────────────────────── WelcomeBrand ──────────────────────────── */

function WelcomeBrand() {
  return (
    <div className="anim-pop-in flex flex-col items-center gap-5">
      {/* Logo tile */}
      <div
        className="relative flex items-center justify-center w-24 h-24 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          boxShadow: `0 0 0 1px rgba(139,92,246,0.15), 0 8px 28px rgba(139,92,246,0.28), 0 2px 6px rgba(0,0,0,0.08)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 55%)",
          }}
        />
        <LogoAnimated
          width={56}
          height={56}
          fill="white"
          cycleDuration={0.7}
          delay={2.5}
        />
      </div>

      {/* Wordmark */}
      <h1
        className="font-fredoka font-semibold text-5xl tracking-tight"
        style={{
          background: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Connect3
      </h1>
    </div>
  );
}

/* ─────────────────────────── ExecutiveQuestion ─────────────────────── */

interface ExecutiveQuestionProps {
  onChoice: (isExec: boolean) => void;
}

function ExecutiveQuestion({ onChoice }: ExecutiveQuestionProps) {
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
            background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
            boxShadow: `0 3px 14px rgba(124,58,237,0.22), 0 1px 3px rgba(0,0,0,0.08)`,
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
            color: "#6d28d9",
            boxShadow: `0 1px 6px rgba(109,40,217,0.06)`,
          }}
        >
          No
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── NotExecResult ─────────────────────────── */

function NotExecResult() {
  return (
    <div className="anim-pop-in w-full flex flex-col items-center gap-4">
      <div
        className="w-full rounded-2xl p-5 text-center"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 20px rgba(109,40,217,0.05)",
        }}
      >
        <div className="flex justify-center mb-3">
          <Logo width={32} height={28} fill={colors.soft} />
        </div>
        <p className="font-fredoka text-lg font-semibold text-slate-600 mb-1">
          You&apos;re all set!
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          The student-facing app is where you discover events and clubs.
          This portal is for club executives only.
        </p>
      </div>

      <a
        id="go-home-link"
        href="/"
        className="group inline-flex items-center gap-2 py-3 px-7 rounded-2xl font-fredoka font-semibold text-lg transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
          boxShadow: `0 4px 16px rgba(124,58,237,0.22)`,
          color: "white",
        }}
      >
        Go to Home
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
      </a>
    </div>
  );
}

/* ─────────────────────────── ClubFinder ────────────────────────────── */

function ClubFinder() {
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null);

  return (
    <div className="anim-pop-in w-full flex flex-col gap-3">
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 24px rgba(109,40,217,0.06)",
        }}
      >
        <label
          htmlFor="club-select"
          className="flex items-center gap-2 text-sm font-semibold mb-2.5 font-fredoka"
          style={{ color: colors.accent }}
        >
          <Building2 className="w-4 h-4" />
          Find your club
        </label>

        {/* <div className="relative">
          <select
            id="club-select"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full appearance-none py-3 pl-4 pr-10 rounded-xl text-sm font-medium outline-none transition-all duration-150"
            style={{
              background: colors.tint,
              border: query
                ? `1.5px solid ${colors.soft}`
                : "1.5px solid #e5e7eb",
              color: query ? "#1e1b4b" : "#9ca3af",
              boxShadow: query ? `0 0 0 3px ${colors.ring}` : "none",
            }}
          >
            <option value="" disabled>
              Select a club…
            </option>
            <option value="chess">Chess Club</option>
            <option value="robotics">Robotics Society</option>
            <option value="debate">Debate Team</option>
            <option value="cs">Computer Science Association</option>
          </select>
          <ChevronRight
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4"
            style={{ color: colors.soft }}
          />
        </div> */}

        {!selectedClub ? <ClubSearchInput onSelect={(club) => setSelectedClub(club)} />
          : <div className="flex gap-1 w-full justify-center items-center py-4">
            <UserAvatar
              avatarUrl={selectedClub.avatar_url}
              size="sm"
              name={selectedClub.first_name}
            />
            <p className="pl-2 font-fredoka">{selectedClub.first_name}</p>
            <X className="size-5 text-red-300 hover:text-red-200 transition-colors cursor-pointer" onClick={() => setSelectedClub(null)} />
          </div>}

        {/* Continue button — slides in once a club is chosen */}
        <div
          className="transition-all duration-400 overflow-hidden"
          style={{
            maxHeight: selectedClub ? "72px" : "0px",
            marginTop: selectedClub ? "12px" : "0",
          }}
        >
          <button
            id="continue-btn"
            className="group w-full py-3 rounded-xl font-fredoka font-semibold text-base flex items-center justify-center gap-2 transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
              boxShadow: `0 3px 14px rgba(124,58,237,0.22)`,
              color: "white",
            }}
          >
            Continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>

      <button
        id="not-in-list-btn"
        className="flex items-center justify-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
        style={{ color: colors.soft }}
      >
        <HelpCircle className="w-4 h-4" />
        My club isn&apos;t in the list
      </button>
    </div>
  );
}

/* ─────────────────────────── Page ──────────────────────────────────── */

type Step = 0 | 1 | 2 | 3 | 4;

export default function Home() {
  const [step, setStep] = useState<Step>(0);
  const [isExecutive, setIsExecutive] = useState<boolean | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleChoice = (choice: boolean) => {
    setIsExecutive(choice);
    setStep(4);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-[#f5f3ff] via-white to-[#ede9fe]">

      {/* ── Ambient blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, #c4b5fd 0%, #8b5cf6 55%, transparent 80%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-48 w-[460px] h-[460px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, #a5b4fc 0%, #6d28d9 55%, transparent 80%)",
          filter: "blur(90px)",
        }}
      />

      {/* ── Dot grid ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c3aed 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.88) translateY(10px); }
          60%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .anim-fade-up { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .anim-pop-in  { animation: popIn  0.6s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center gap-8">

        {/* Step 1 — "Welcome To" */}
        {step >= 1 && (
          <p className="anim-fade-up font-fredoka text-2xl font-medium text-violet-400">
            Welcome To
          </p>
        )}

        {/* Step 2 — logo + wordmark */}
        {step >= 2 && <WelcomeBrand />}

        {/* Step 3 — executive question */}
        {step >= 3 && step < 4 && <ExecutiveQuestion onChoice={handleChoice} />}

        {/* Step 4a — not an exec */}
        {step >= 4 && isExecutive === false && <NotExecResult />}

        {/* Step 4b — exec club finder */}
        {step >= 4 && isExecutive === true && <ClubFinder />}
      </div>
    </div>
  );
}
