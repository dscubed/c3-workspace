import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { signPayload } from "@c3/qr";
import { generateApplePass, generateGooglePassUrl } from "@/lib/pass/pass-generator";

async function getOrCreatePass(userId: string, secret: string) {
  const [{ data: profile }, { data: tokenRow, error: tokenError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("first_name, last_name").eq("id", userId).single(),
    supabaseAdmin
      .from("pass_tokens")
      .upsert({ user_id: userId }, { onConflict: "user_id" })
      .select("id")
      .single(),
  ]);

  if (tokenError || !tokenRow) throw new Error("Failed to create pass token");

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  const memberId = signPayload("pass", tokenRow.id, secret);

  return { displayName, memberId };
}

// GET — SWR-friendly, returns memberId only (fast, no wallet generation)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = process.env.PASS_SECRET;
    if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const { memberId } = await getOrCreatePass(user.id, secret);
    return NextResponse.json({ memberId });
  } catch (error) {
    console.error("GET /api/pass error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — generates wallet passes (called lazily after QR is shown)
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = process.env.PASS_SECRET;
    if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const email = user.email;
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const { displayName, memberId } = await getOrCreatePass(user.id, secret);

    const passData = { name: displayName, email, userId: user.id, memberId };

    const [googlePassUrl, applePassBuffer] = await Promise.all([
      Promise.resolve(generateGooglePassUrl(passData)),
      generateApplePass(passData).catch((e) => {
        console.error("Apple pass generation failed:", e);
        return null;
      }),
    ]);

    return NextResponse.json({
      memberId,
      googlePassUrl: googlePassUrl ?? undefined,
      applePassData: applePassBuffer ? applePassBuffer.toJSON() : undefined,
    });
  } catch (error) {
    console.error("POST /api/pass error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
