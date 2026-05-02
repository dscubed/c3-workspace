"use client";

import AuthLoadingSpinner from "@/components/ui/AuthLoadingSpinner";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/auth/signup";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { cn } from "@/lib/utils";

function SignUpSuccessContent() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();

  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const pendingEmail = searchParams.get("email") ?? "";

  const handleResendVerification = async () => {
    if (!pendingEmail) return;

    setIsResending(true);
    try {
      const { error } = await resendVerificationEmail(pendingEmail);
      if (error) {
        toast.error(error.message || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error("An error occurred while resending verification email");
      console.error("Resend verification error:", error);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (user && (user.email_confirmed_at || user.confirmed_at)) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <AuthShell>
      {loading && user ? (
        <AuthLoadingSpinner fullPage={false} />
      ) : (
        <div className="w-full flex flex-col gap-3">
          <h1 className="text-2xl font-medium tracking-tight text-black">
            Thank you for signing up!
          </h1>

          <p className="text-base text-black/50">
            Check your email to confirm your account before signing in.
          </p>

          <p className="text-base text-black/50 leading-relaxed">
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
          </p>

          <Button
            onClick={handleResendVerification}
            disabled={isResending || !pendingEmail}
            className={cn(
              "mt-2 w-full rounded-md text-sm font-semibold text-white",
              "bg-foreground hover:bg-foreground/80 transition-colors",
            )}
          >
            {isResending
              ? "Sending..."
              : !pendingEmail
                ? "Unable to Resend"
                : "Resend Confirmation"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignUpSuccessContent />
    </Suspense>
  );
}
