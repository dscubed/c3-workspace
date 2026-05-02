import { NextRequest, NextResponse } from "next/server";

/* ================================================================
   DELETE /api/invites/[id]
   Cancel an outgoing invite (only the inviter can do this).
================================================================ */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hostId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hostRow, error: fetchErr } = await supabaseAdmin
      .from("event_hosts")
      .select("id, inviter_id, status")
      .eq("id", hostId)
      .single();

    if (fetchErr || !hostRow) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (hostRow.inviter_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (hostRow.status !== "pending") {
      return NextResponse.json({ error: "Can only cancel pending invites" }, { status: 409 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("event_hosts")
      .delete()
      .eq("id", hostId);

    if (deleteErr) {
      return NextResponse.json({ error: "Failed to cancel invite" }, { status: 500 });
    }

    return NextResponse.json({ data: { id: hostId } });
  } catch (error) {
    console.error("DELETE /api/invites/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

/* ================================================================
   PATCH /api/invites/[id]
   Accept or decline a collaboration invite.
   The [id] is the event_hosts row ID.
   Body: { action: "accept" | "decline" }
================================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hostId } = await params;

    /* Auth check */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* Parse body */
    const body = await request.json();
    const action: string = body.action;

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "decline"' },
        { status: 400 },
      );
    }

    /* Fetch the host row and verify the current user is the invitee */
    const { data: hostRow, error: fetchErr } = await supabaseAdmin
      .from("event_hosts")
      .select("id, event_id, profile_id, status")
      .eq("id", hostId)
      .single();

    if (fetchErr || !hostRow) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (hostRow.profile_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (hostRow.status !== "pending") {
      return NextResponse.json(
        { error: `Invite already ${hostRow.status}` },
        { status: 409 },
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    /* Update the host row status */
    const { error: updateErr } = await supabaseAdmin
      .from("event_hosts")
      .update({ status: newStatus })
      .eq("id", hostId);

    if (updateErr) {
      console.error("Failed to update invite:", updateErr);
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { id: hostId, status: newStatus } });
  } catch (error) {
    console.error("PATCH /api/invites/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
