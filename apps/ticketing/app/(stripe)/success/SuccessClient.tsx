"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  Ticket,
  ArrowRight,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/lib/auth/sso";
import { cn } from "@/lib/utils";

type PollState = "polling" | "success" | "timeout";

interface SuccessClientProps {
  flow: "ticket" | "registration";
  isAuthed: boolean;
  eventName: string;
  eventDate: string | null;
  venueName: string | null;
  thumbnailUrl: string | null;
  tierName: string | null;
  amountPaid: number | null;
  customerEmail: string;
  eventLinkPath: string;
  orderId: string;
  registrationPending: boolean;
}

export function SuccessClient({
  flow,
  isAuthed,
  eventName,
  eventDate,
  venueName,
  thumbnailUrl,
  tierName,
  amountPaid,
  customerEmail,
  eventLinkPath,
  orderId,
  registrationPending,
}: SuccessClientProps) {
  const [mounted, setMounted] = useState(false);
  const [pollState, setPollState] = useState<PollState>(
    registrationPending ? "polling" : "success",
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Poll for registration if Stripe webhook hasn't landed yet
  useEffect(() => {
    if (pollState !== "polling" || flow !== "ticket") return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(
          `/api/registrations/by-session?session_id=${encodeURIComponent(orderId)}`,
        );
        if (res.ok) {
          const j = await res.json();
          if (j.data?.id) {
            if (!cancelled) setPollState("success");
            return;
          }
        }
      } catch {
        /* ignore network blips */
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        if (!cancelled) setPollState("timeout");
      }
    };

    const initial = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(initial);
    };
  }, [pollState, flow, orderId]);

  const handleAuth = (mode: "login" | "signup") => {
    window.location.href = getLoginUrl(window.location.origin, "/dashboard/tickets", mode);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500",
          mounted ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="relative flex min-h-full items-center justify-center p-4 py-6">
        <div
          className={cn(
            "w-full max-w-sm transform transition-all duration-500 ease-out",
            mounted
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-6 opacity-0 scale-95",
          )}
        >
          {pollState === "polling" ? (
            <PollingCard />
          ) : pollState === "timeout" ? (
            <TimeoutCard eventLinkPath={eventLinkPath} orderId={orderId} />
          ) : (
            <SuccessCard
              flow={flow}
              isAuthed={isAuthed}
              eventName={eventName}
              eventDate={eventDate}
              venueName={venueName}
              thumbnailUrl={thumbnailUrl}
              tierName={tierName}
              amountPaid={amountPaid}
              customerEmail={customerEmail}
              eventLinkPath={eventLinkPath}
              orderId={orderId}
              mounted={mounted}
              handleAuth={handleAuth}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PollingCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/10">
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">Processing your payment…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This usually takes a few seconds. Please don&apos;t close this page.
          </p>
        </div>
      </div>
    </div>
  );
}

function TimeoutCard({
  eventLinkPath,
  orderId,
}: {
  eventLinkPath: string;
  orderId: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/10">
      <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 px-6 pt-6 pb-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
          <AlertCircle className="size-7 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="mt-3 text-xl font-bold text-white">Payment received</h1>
        <p className="mt-0.5 text-xs text-white/90">But your ticket is taking longer than usual</p>
      </div>
      <div className="px-4 pt-4 pb-5 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your payment went through. Your ticket confirmation email will arrive
          shortly — check your inbox (and spam). If nothing arrives within 10
          minutes, contact support with your reference below.
        </p>
        <Button asChild className="w-full">
          <Link href={eventLinkPath}>Back to event</Link>
        </Button>
        <p className="text-center text-[10px] text-muted-foreground/60">
          Ref: {orderId.slice(0, 20)}…
        </p>
      </div>
    </div>
  );
}

function SuccessCard({
  flow,
  isAuthed,
  eventName,
  eventDate,
  venueName,
  thumbnailUrl,
  tierName,
  amountPaid,
  customerEmail,
  eventLinkPath,
  orderId,
  mounted,
  handleAuth,
}: {
  flow: "ticket" | "registration";
  isAuthed: boolean;
  eventName: string;
  eventDate: string | null;
  venueName: string | null;
  thumbnailUrl: string | null;
  tierName: string | null;
  amountPaid: number | null;
  customerEmail: string;
  eventLinkPath: string;
  orderId: string;
  mounted: boolean;
  handleAuth: (mode: "login" | "signup") => void;
}) {
  const heading = flow === "ticket" ? "You're in!" : "You're registered!";
  const sub =
    flow === "ticket"
      ? "Your ticket is on its way"
      : "Your check-in code is on its way";

  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/10">
      {/* Header gradient + check */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 px-6 pt-6 pb-8 text-center">
        <div
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 transition-all duration-700 ease-out",
            mounted ? "scale-100 rotate-0" : "scale-0 -rotate-180",
          )}
        >
          <CheckCircle2 className="size-7 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="mt-3 text-xl font-bold text-white">{heading}</h1>
        <p className="mt-0.5 text-xs text-white/90">{sub}</p>
      </div>

      {/* Ticket subcard */}
      <div className="-mt-3 px-4">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex">
            {thumbnailUrl && (
              <div className="relative w-20 shrink-0 bg-muted">
                <Image
                  src={thumbnailUrl}
                  alt={eventName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 px-3 py-2.5 space-y-2">
              <div>
                <p className="text-sm font-bold leading-tight">{eventName}</p>
                {(eventDate || venueName) && (
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    {eventDate && <span className="block">{eventDate}</span>}
                    {venueName && <span className="block">{venueName}</span>}
                  </p>
                )}
              </div>
              {(tierName || amountPaid !== null) && (
                <>
                  <div className="border-t border-dashed" />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Ticket className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-medium">
                        {tierName ?? "Ticket"}
                      </span>
                    </div>
                    {amountPaid !== null && (
                      <span className="shrink-0 text-xs font-bold">
                        {amountPaid > 0 ? `$${amountPaid.toFixed(2)}` : "Free"}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
          <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            We&apos;ve sent your{" "}
            {flow === "ticket" ? "ticket" : "check-in code"} to{" "}
            <span className="font-medium text-foreground">{customerEmail}</span>
            . Bring the QR on the day.
          </p>
        </div>

        {isAuthed ? (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/tickets">
                View my tickets
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={eventLinkPath}>Back to event</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              Sign up to keep your tickets in one place
            </p>
            <Button className="w-full" onClick={() => handleAuth("signup")}>
              <UserPlus className="size-4" />
              Create account
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleAuth("login")}
              >
                <LogIn className="size-4" />
                Sign in
              </Button>
              <Button asChild variant="ghost" className="flex-1">
                <Link href={eventLinkPath}>Back to event</Link>
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground/60">
          Ref: {orderId.slice(0, 20)}…
        </p>
      </div>
    </div>
  );
}
