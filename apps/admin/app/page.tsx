"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { WelcomeBrand } from "@/components/home/WelcomeBrand";
import { ExecutiveQuestion } from "@/components/home/ExecutiveQuestion";
import { NotExecResult } from "@/components/home/NotExecResult";
import { ClubFinder } from "@/components/home/ClubFinder";
import { RequestClubAdd } from "@/components/home/RequestClubAdd";
import { EmailVerification } from "@/components/home/EmailVerification";
import type { ClubResult } from "@/components/clubs/ClubSearchInput";

type Step = 0 | 1 | 2 | 3 | 4;

export default function Home() {
  const [pageIndex, setPageIndex] = useState(0);
  const [step, setStep] = useState<Step>(0);
  const [isExecutive, setIsExecutive] = useState<boolean | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null);
  const [showRequest, setShowRequest] = useState(false);

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

  const handleContinue = () => setPageIndex(1);
  const handleBack = () => setPageIndex(0);

  return (
    <div className="relative h-dvh flex flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-[#f5f3ff] via-white to-[#ede9fe]">

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

      {pageIndex > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={handleBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "#a78bfa" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
      )}

      <div className="relative z-10 w-full overflow-hidden">
        <motion.div
          className="flex w-full"
          animate={{ x: `-${pageIndex * 100}%` }}
          transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full shrink-0">
            <div className="max-w-sm mx-auto w-full flex flex-col items-center text-center gap-8">
              {step >= 1 && !showRequest && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="font-fredoka text-xl sm:text-2xl font-medium text-violet-400"
                >
                  Welcome To
                </motion.p>
              )}

              {step >= 2 && !showRequest && <WelcomeBrand />}

              {step >= 3 && step < 4 && <ExecutiveQuestion onChoice={handleChoice} />}

              {step >= 4 && isExecutive === false && <NotExecResult />}

              {step >= 4 && isExecutive === true && !showRequest && (
                <ClubFinder
                  selectedClub={selectedClub}
                  onSelectClub={setSelectedClub}
                  onClearClub={() => setSelectedClub(null)}
                  onContinue={handleContinue}
                  onRequestClub={() => setShowRequest(true)}
                />
              )}

              {showRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col gap-4"
                >
                  <button
                    onClick={() => setShowRequest(false)}
                    className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 self-start"
                    style={{ color: "#a78bfa" }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <RequestClubAdd />
                </motion.div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0">
            <div className="max-w-sm mx-auto w-full">
              {selectedClub && <EmailVerification club={selectedClub} />}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
