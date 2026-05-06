"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@c3/ui";
import { ArrowRight } from "lucide-react";
import { colors } from "./tokens";

export function NotExecResult() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, duration: 0.6 }}
      className="w-full flex flex-col items-center gap-4"
    >
      <div
        className="w-full rounded-2xl p-5 text-center"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 20px rgba(167,139,250,0.05)",
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

      <Link
        id="go-home-link"
        href="/"
        className="group inline-flex items-center gap-2 py-3 px-7 rounded-2xl font-fredoka font-semibold text-lg transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
          boxShadow: `0 4px 16px rgba(167,139,250,0.22)`,
          color: "white",
        }}
      >
        Go to Home
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
      </Link>
    </motion.div>
  );
}
