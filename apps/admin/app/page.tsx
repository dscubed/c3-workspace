"use client";

import { useState, useEffect } from "react";
import { WelcomeBrand } from "@/components/home/WelcomeBrand";
import { ExecutiveQuestion } from "@/components/home/ExecutiveQuestion";
import { NotExecResult } from "@/components/home/NotExecResult";
import { ClubFinder } from "@/components/home/ClubFinder";

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

        {step >= 1 && (
          <p className="anim-fade-up font-fredoka text-2xl font-medium text-violet-400">
            Welcome To
          </p>
        )}

        {step >= 2 && <WelcomeBrand />}

        {step >= 3 && step < 4 && <ExecutiveQuestion onChoice={handleChoice} />}

        {step >= 4 && isExecutive === false && <NotExecResult />}

        {step >= 4 && isExecutive === true && <ClubFinder />}
      </div>
    </div>
  );
}
