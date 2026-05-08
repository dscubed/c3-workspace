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

    const [{ data: adminRows, error }, { data: ownProfile }] = await Promise.all([
      supabaseAdmin
        .from("club_admins")
        .select(
          `id, club_id, role, status, created_at,
           club:club_id(id, first_name, last_name, avatar_url, account_type)`,
        )
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, account_type")
        .eq("id", user.id)
        .eq("account_type", "organisation")
        .maybeSingle(),
    ]);

    if (error) {
      console.error("Failed to fetch my clubs:", error);
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    const rows = adminRows ?? [];

    // Club is logged in as itself — synthesise an owner row so the store populates
    if (ownProfile) {
      const alreadyPresent = rows.some((r) => r.club_id === user.id);
      if (!alreadyPresent) {
        rows.unshift({
          id: `owner-${user.id}`,
          club_id: user.id,
          role: "owner",
          status: "accepted",
          created_at: new Date(0).toISOString(),
          club: ownProfile,
        } as unknown as (typeof rows)[number]);
      }
    }

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/clubs/my-clubs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
