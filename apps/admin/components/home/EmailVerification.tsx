"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { UserAvatar } from "@c3/ui";
import { ArrowRight, Loader2, CheckCircle2, Mail, MoveLeft } from "lucide-react";
import type { ClubResult } from "@/components/clubs/ClubSearchInput";
import { fetcher } from "@/lib/fetcher";
import { OtpForm } from "./OtpForm";
import { AccountSetup } from "./AccountSetup";
import { ReportIncorrectEmail } from "./ReportIncorrectEmail";
import { colors } from "./tokens";

interface OnboardingData {
  club_email: string | null;
  otp_verified: boolean;
  onboarded: boolean;
  session_valid: boolean;
}

interface EmailVerificationProps {
  club: ClubResult;
}

function obfuscateEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const stars = "*".repeat(local.length - 2);
  return `${local[0]}${stars}${local[local.length - 1]}@${domain}`;
}

function fetchJson(url: string, init: RequestInit) {
  return fetch(url, init).then(async (res) => {
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Request failed");
    return body;
  });
}

export function EmailVerification({ club }: EmailVerificationProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);

  const { data: onboarding, isLoading, mutate } = useSWR<OnboardingData>(
    `/api/admin/onboarding?club_id=${club.id}`,
    fetcher,
  );

  const handleSend = async () => {
    if (hasSent) {
      setOtpSent(true);
      return;
    }
    setSendError(null);
    setSending(true);
    try {
      await fetchJson("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id }),
      });
      setHasSent(true);
      setOtpSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setSendError(null);
    setResending(true);
    try {
      await fetchJson("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id }),
      });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (code: string) => {
    setVerifyError(null);
    setVerifying(true);
    try {
      await fetchJson("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id, otp: code }),
      });
      // Server set httpOnly cookie — refetch to get session_valid: true
      await mutate();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setSendError(null);
    setVerifyError(null);
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.soft }} />
      </div>
    );
  }

  if (showCorrection) {
    return (
        <ReportIncorrectEmail handleBack={() => setShowCorrection(false)} />
    );
  }

  if (onboarding?.onboarded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center gap-4 pt-4"
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: colors.tint }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: colors.accent }} />
        </div>
        <h2 className="font-fredoka text-2xl font-semibold text-slate-700">Already onboarded</h2>
        <p className="text-sm text-slate-400 text-center leading-relaxed">
          Your club has already completed onboarding. You can access the admin dashboard to manage your club.
        </p>
      </motion.div>
    );
  }

  if (onboarding?.session_valid) {
    return (
      <AccountSetup
        club={club}
        prefilledEmail={onboarding.club_email ?? ""}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 pt-4">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="font-fredoka text-2xl sm:text-3xl font-semibold text-slate-700"
      >
        Welcome to Connect3!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="flex items-center gap-3 w-full overflow-hidden"
      >
        <UserAvatar avatarUrl={club.avatar_url} size="sm" name={club.first_name} />
        <p className="font-fredoka text-xl font-medium text-slate-600 truncate min-w-0">
          {club.first_name}
        </p>
      </motion.div>

      <div className="w-full overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: otpSent ? "-100%" : "0%" }}
          transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full shrink-0 overflow-hidden">
            <div className="flex flex-col items-center gap-4">
            <div
              className="w-full rounded-2xl p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(167,139,250,0.05)",
              }}
            >
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                In order to gain access to your account we just need to simply verify your email!
              </p>

              {onboarding?.club_email ? (
                <>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mb-3"
                    style={{ background: colors.tint, color: colors.accent }}
                  >
                    {obfuscateEmail(onboarding.club_email)}
                  </div>
                  <p className="text-xs text-slate-400">Is this your email?</p>
                  <button
                    onClick={() => setShowCorrection(true)}
                    className="text-xs font-medium transition-opacity hover:opacity-70 mt-1"
                    style={{ color: colors.soft }}
                  >
                    Email is incorrect?
                  </button>
                </>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: colors.tint, color: "#94a3b8" }}
                >
                  <Mail className="w-4 h-4" />
                  No email on file
                </div>
              )}

              {sendError && (
                <p className="mt-3 text-xs" style={{ color: "#ef4444" }}>{sendError}</p>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !onboarding?.club_email}
              className="group w-full py-3 rounded-xl font-fredoka font-semibold text-base flex items-center justify-center gap-2 transition-all duration-250 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
                boxShadow: `0 3px 14px rgba(167,139,250,0.22)`,
                color: "white",
              }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send verification pin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
            </div>
          </div>

          <div className="w-full shrink-0 overflow-hidden">
            <OtpForm
              onVerify={handleVerify}
              onResend={handleResend}
              onBack={handleBack}
              verifying={verifying}
              resending={resending}
              verifyError={verifyError}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
