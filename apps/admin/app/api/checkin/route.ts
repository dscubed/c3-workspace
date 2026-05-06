import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin, checkEventPermission } from "@c3/supabase";
import { verifyPayload } from "@c3/qr";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw: unknown = body?.raw;

  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Missing raw" }, { status: 400 });
  }

  const secret = process.env.TICKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verified = verifyPayload(raw, secret);
  if (!verified) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
  }

  if (verified.prefix !== "ticket") {
    return NextResponse.json({ error: "Wrong QR type" }, { status: 400 });
  }

  const { data: registration } = await supabaseAdmin
    .from("event_registrations")
    .select("id, first_name, last_name, email, event_id, checked_in, checked_in_at")
    .eq("qr_code_id", verified.id)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("name")
    .eq("id", registration.event_id)
    .single();

  const perm = await checkEventPermission(registration.event_id, user.id);
  if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (registration.checked_in) {
    return NextResponse.json(
      {
        error: "Already checked in",
        name: `${registration.first_name} ${registration.last_name}`,
        checked_in_at: registration.checked_in_at,
      },
      { status: 409 },
    );
  }

  const checked_in_at = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("event_registrations")
    .update({ checked_in: true, checked_in_at, checked_in_by: user.id })
    .eq("id", registration.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }

  return NextResponse.json({
    name: `${registration.first_name} ${registration.last_name}`,
    email: registration.email,
    event_name: event?.name ?? null,
    checked_in_at,
  });
}
