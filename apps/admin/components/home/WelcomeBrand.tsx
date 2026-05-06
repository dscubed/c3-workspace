"use client";

import { motion } from "framer-motion";
import { LogoAnimated } from "@c3/ui";

export function WelcomeBrand() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, duration: 0.6 }}
      className="flex flex-col items-center gap-5"
    >
      <div
        className="relative flex items-center justify-center w-24 h-24 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)",
          boxShadow: `0 0 0 1px rgba(196,181,253,0.15), 0 8px 28px rgba(196,181,253,0.28), 0 2px 6px rgba(0,0,0,0.08)`,
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

      <h1
        className="font-fredoka font-semibold text-3xl sm:text-5xl tracking-tight"
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Connect3
      </h1>
    </motion.div>
  );
}
