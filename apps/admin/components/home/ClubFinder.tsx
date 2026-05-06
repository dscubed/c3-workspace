"use client";

import { motion } from "framer-motion";
import { UserAvatar } from "@c3/ui";
import { Building2, HelpCircle, ArrowRight, X } from "lucide-react";
import { ClubSearchInput, type ClubResult } from "@/components/clubs/ClubSearchInput";
import { colors } from "./tokens";

interface ClubFinderProps {
  selectedClub: ClubResult | null;
  onSelectClub: (club: ClubResult) => void;
  onClearClub: () => void;
  onContinue: () => void;
  onRequestClub: () => void;
}

export function ClubFinder({ selectedClub, onSelectClub, onClearClub, onContinue, onRequestClub }: ClubFinderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, duration: 0.6 }}
      className="w-full flex flex-col gap-3"
    >
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 24px rgba(167,139,250,0.06)",
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

        {!selectedClub ? <ClubSearchInput onSelect={onSelectClub} />
          : <div className="flex gap-1 w-full justify-center items-center py-4">
            <UserAvatar
              avatarUrl={selectedClub.avatar_url}
              size="sm"
              name={selectedClub.first_name}
            />
            <p className="pl-2 font-fredoka truncate min-w-0">{selectedClub.first_name}</p>
            <X className="size-5 text-red-300 hover:text-red-200 transition-colors cursor-pointer" onClick={onClearClub} />
          </div>}

        <div
          className="transition-all duration-400 overflow-hidden"
          style={{
            maxHeight: selectedClub ? "72px" : "0px",
            marginTop: selectedClub ? "12px" : "0",
          }}
        >
          <button
            id="continue-btn"
            onClick={onContinue}
            className="group w-full py-3 rounded-xl font-fredoka font-semibold text-base flex items-center justify-center gap-2 transition-all duration-250 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
              boxShadow: `0 3px 14px rgba(167,139,250,0.22)`,
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
        onClick={() => onRequestClub()}
        className="flex items-center justify-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
        style={{ color: colors.soft }}
      >
        <HelpCircle className="w-4 h-4" />
        My club isn&apos;t in the list
      </button>
    </motion.div>
  );
}
