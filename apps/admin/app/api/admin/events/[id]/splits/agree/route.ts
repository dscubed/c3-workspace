import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@c3/supabase/club-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perm = await checkEventPermission(eventId, user.id);
    if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: splits } = await supabaseAdmin
      .from("event_payout_splits")
      .select("club_id, percentage")
      .eq("event_id", eventId);

    if (!splits || splits.length === 0) {
      return NextResponse.json(
        { error: "No splits configured for this event" },
        { status: 400 },
      );
    }

    const splitClubIds = new Set(splits.map((s) => s.club_id));
    if (!splitClubIds.has(user.id)) {
      return NextResponse.json(
        { error: "You are not a party in the current split" },
        { status: 403 },
      );
    }

    const snapshot = splits.map((s) => ({
      club_id: s.club_id,
      percentage: Number(s.percentage),
    }));

    await supabaseAdmin
      .from("event_payout_split_agreements")
      .upsert(
        {
          event_id: eventId,
          club_id: user.id,
          split_snapshot: snapshot,
          agreed_at: new Date().toISOString(),
        },
        { onConflict: "event_id,club_id" },
      );

    const { data: agreements } = await supabaseAdmin
      .from("event_payout_split_agreements")
      .select("club_id, agreed_at, split_snapshot")
      .eq("event_id", eventId);

    const allAgreed =
      agreements &&
      agreements.length === splits.length &&
      agreements.every((a) => {
        const aSnap = (a.split_snapshot as { club_id: string; percentage: number }[]) ?? [];
        if (aSnap.length !== snapshot.length) return false;
        return snapshot.every(
          (s) =>
            aSnap.find(
              (as) => as.club_id === s.club_id && as.percentage === s.percentage,
            ),
        );
      });

    return NextResponse.json({
      data: {
        agreements: (agreements ?? []).map((a) => ({
          club_id: a.club_id,
          agreed_at: a.agreed_at,
          split_snapshot: a.split_snapshot,
        })),
        all_agreed: allAgreed,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/events/[id]/splits/agree error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
