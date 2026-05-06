import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin, checkEventPermission } from "@c3/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> },
) {
  const { id: eventId, regId } = await params;

  const body = await request.json().catch(() => null);
  const checked_in: unknown = body?.checked_in;

  if (typeof checked_in !== "boolean") {
    return NextResponse.json({ error: "checked_in must be boolean" }, { status: 400 });
  }

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

  const { data: registration } = await supabaseAdmin
    .from("event_registrations")
    .select("id, event_id")
    .eq("id", regId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  const update = checked_in
    ? { checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: user.id }
    : { checked_in: false, checked_in_at: null, checked_in_by: null };

  const { error: updateError } = await supabaseAdmin
    .from("event_registrations")
    .update(update)
    .eq("id", regId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...update });
}
