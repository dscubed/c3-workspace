import { NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRows, error } = await supabaseAdmin
      .from("club_admins")
      .select(
        `id, club_id, role, status, created_at,
         club:club_id(id, first_name, last_name, avatar_url, account_type)`,
      )
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch my clubs:", error);
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    return NextResponse.json({ data: adminRows });
  } catch (error) {
    console.error("GET /api/clubs/my-clubs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
