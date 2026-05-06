"use client";

import { useState } from "react";
import { UserAvatar } from "@c3/ui";
import { Building2, HelpCircle, ArrowRight, X } from "lucide-react";
import { ClubSearchInput, type ClubResult } from "@/components/clubs/ClubSearchInput";
import { colors } from "./tokens";

export function ClubFinder() {
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null);

  return (
    <div className="anim-pop-in w-full flex flex-col gap-3">
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
        className="flex items-center justify-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
        style={{ color: colors.soft }}
      >
        <HelpCircle className="w-4 h-4" />
        My club isn&apos;t in the list
      </button>
    </div>
  );
}
