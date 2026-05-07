import { createClient } from "@c3/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = searchParams.get("next");

  if (accessToken && refreshToken) {
    const supabase = await createClient();
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      const destination = next?.startsWith("http") ? next : `${origin}${next ?? "/dashboard"}`;
      return NextResponse.redirect(destination);
    }
  }

  const connectUrl = process.env.NEXT_PUBLIC_CONNECT3_URL ?? "https://connect3.app";
  return NextResponse.redirect(`${connectUrl}/auth/login`);
}
