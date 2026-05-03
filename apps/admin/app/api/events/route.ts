import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { getClubAdminRow } from "@c3/supabase/club-admin";
import { fetchClubEventCards } from "@c3/supabase/events";

export async function GET(request: NextRequest) {
  const clubId = request.nextUrl.searchParams.get("club_id");
  if (!clubId) {
    return NextResponse.json({ error: "club_id is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminRow = await getClubAdminRow(clubId, user.id);
    if (!adminRow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await fetchClubEventCards(clubId);
    return NextResponse.json({ data: events });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
