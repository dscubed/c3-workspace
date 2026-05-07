import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
    p_email: email,
  });

  if (error) {
    console.error("[check-email] rpc error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    exists: !!data,
    userId: data ?? null,
  });
}
