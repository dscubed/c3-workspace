import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { getClubAdminRow } from "@c3/supabase/club-admin";
import { fetchEventRegistrations } from "@c3/supabase";
import { supabaseAdmin } from "@c3/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user is an admin of the club that owns this event
    const { data: event } = await supabaseAdmin
      .from("event_summary")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Resolve the club from the creator profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("club_id")
      .eq("id", event.creator_profile_id)
      .single();

    if (profile?.club_id) {
      const adminRow = await getClubAdminRow(profile.club_id, user.id);
      if (!adminRow) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const registrations = await fetchEventRegistrations(eventId);
    return NextResponse.json({ data: registrations });
  } catch (err) {
    console.error("GET /api/events/[id]/registrations error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
