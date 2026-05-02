import { NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

async function canAccessClub(clubId: string, userId: string): Promise<boolean> {
  if (clubId === userId) return true;
  const { data } = await supabaseAdmin
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  return !!data;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clubId } = await params;

    if (!(await canAccessClub(clubId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("club_memberships")
      .select(
        `id, matched_product_name, verified_email, verified_at,
         profile:user_id(id, first_name, last_name, avatar_url)`,
      )
      .eq("club_id", clubId)
      .order("verified_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch club members:", error);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/clubs/[id]/members error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
