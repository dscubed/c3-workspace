import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin, checkEventPermission } from "@c3/supabase";
import { verifyPayload } from "@c3/qr";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw: unknown = body?.raw;
  const eventId: unknown = body?.eventId;

  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Missing raw" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── ticket: prefix ─────────────────────────────────────────────────────────
  if (raw.startsWith("ticket:")) {
    const ticketSecret = process.env.TICKET_SECRET;
    if (!ticketSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const verified = verifyPayload(raw, ticketSecret);
    if (!verified || verified.prefix !== "ticket") {
      return NextResponse.json({ error: "Invalid ticket QR" }, { status: 400 });
    }

    const { data: registration } = await supabaseAdmin
      .from("event_registrations")
      .select("id, first_name, last_name, email, event_id, checked_in, checked_in_at")
      .eq("qr_code_id", verified.id)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

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

    const { data: event } = await supabaseAdmin
      .from("event_summary")
      .select("name")
      .eq("id", registration.event_id)
      .single();

    const checked_in_at = new Date().toISOString();
    await supabaseAdmin
      .from("event_registrations")
      .update({ checked_in: true, checked_in_at, checked_in_by: user.id })
      .eq("id", registration.id);

    return NextResponse.json({
      name: `${registration.first_name} ${registration.last_name}`,
      email: registration.email,
      event_name: event?.name ?? null,
      checked_in_at,
    });
  }

  // ── pass: prefix ───────────────────────────────────────────────────────────
  if (raw.startsWith("pass:")) {
    const passSecret = process.env.PASS_SECRET;
    if (!passSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId required for pass check-in" }, { status: 400 });
    }

    const verified = verifyPayload(raw, passSecret);
    if (!verified || verified.prefix !== "pass") {
      return NextResponse.json({ error: "Invalid pass QR" }, { status: 400 });
    }

    const { data: tokenRow } = await supabaseAdmin
      .from("pass_tokens")
      .select("user_id")
      .eq("id", verified.id)
      .maybeSingle();

    if (!tokenRow) {
      return NextResponse.json({ error: "Pass not found or revoked" }, { status: 404 });
    }

    const perm = await checkEventPermission(eventId, user.id);
    if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: registration } = await supabaseAdmin
      .from("event_registrations")
      .select("id, first_name, last_name, email, checked_in, checked_in_at")
      .eq("user_id", tokenRow.user_id)
      .eq("event_id", eventId)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json({ error: "Not registered for this event" }, { status: 404 });
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

    const { data: event } = await supabaseAdmin
      .from("event_summary")
      .select("name")
      .eq("id", eventId)
      .single();

    const checked_in_at = new Date().toISOString();
    await supabaseAdmin
      .from("event_registrations")
      .update({ checked_in: true, checked_in_at, checked_in_by: user.id })
      .eq("id", registration.id);

    return NextResponse.json({
      name: `${registration.first_name} ${registration.last_name}`,
      email: registration.email,
      event_name: event?.name ?? null,
      checked_in_at,
    });
  }

  return NextResponse.json({ error: "Unrecognised QR prefix" }, { status: 400 });
}
