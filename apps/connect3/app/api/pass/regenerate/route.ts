import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { signPayload } from "@c3/qr";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.PASS_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Delete existing token → insert new one (new UUID = old QR dead)
  await supabaseAdmin.from("pass_tokens").delete().eq("user_id", user.id);

  const { data: tokenRow, error } = await supabaseAdmin
    .from("pass_tokens")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !tokenRow) {
    return NextResponse.json({ error: "Failed to regenerate pass" }, { status: 500 });
  }

  const passToken = signPayload("pass", tokenRow.id, secret);

  return NextResponse.json({ success: true, memberId: passToken });
}
