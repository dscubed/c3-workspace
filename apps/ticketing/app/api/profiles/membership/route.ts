import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

export async function GET(request: NextRequest) {
  const clubId = request.nextUrl.searchParams.get("club_id");
  if (!clubId) {
    return NextResponse.json({ error: "club_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("club_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data: { isMember: !!data } });
}
