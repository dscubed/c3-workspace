const SSO_BASE =
  process.env.NEXT_PUBLIC_SSO_BASE_URL || "https://connect3.app/auth/sso";

/**
 * Returns true if `url` is a safe redirect target for SSO flows.
 * Allows any *.connect3.app subdomain in production, and localhost in development.
 */
export function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (
      process.env.NODE_ENV === "development" &&
      parsed.hostname === "localhost"
    ) {
      return true;
    }

    return (
      parsed.protocol === "https:" && parsed.hostname.endsWith(".connect3.app")
    );
  } catch {
    return false;
  }
}

/**
 * Builds a login URL that redirects the user to connect3 for SSO authentication.
 *
 * Flow:
 *  1. User hits a protected page on a satellite app (admin, ticketing, etc.)
 *  2. They get redirected to [SSO_BASE] (connect3.app/auth/sso)
 *  3. User authenticates (or is already logged in) on connect3
 *  4. connect3 injects tokens and forwards back to <origin>/auth/callback
 *  5. Satellite app calls supabase.auth.setSession() and redirects to `next`
 *
 * @param origin       - The satellite app's origin, e.g. "https://admin.connect3.app"
 * @param redirectPath - The path on this app to land on after login (default: "/")
 * @param mode         - "login" (default) or "signup"
 */
export function getLoginUrl(
  origin: string,
  redirectPath: string = "/",
  mode: "login" | "signup" = "login",
): string {
  const callbackUrl = `${origin}/auth/callback`;
  const finalRedirect = `${origin}${redirectPath}`;

  const params = new URLSearchParams({
    redirect_to: callbackUrl,
    next: finalRedirect,
    ...(mode === "signup" ? { mode: "signup" } : {}),
  });

  return `${SSO_BASE}?${params.toString()}`;
}
