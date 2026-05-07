import { NextRequest, NextResponse } from "next/server";
import { requireClubAdmin } from "@/lib/auth/clubGuard";
import { fetchClubEventCardsWithStats } from "@c3/supabase/events";

export async function GET(request: NextRequest) {
  try {
    const clubId = request.nextUrl.searchParams.get("club_id");
    const auth = await requireClubAdmin(clubId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const events = await fetchClubEventCardsWithStats(auth.clubId);
    return NextResponse.json({ data: events });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
