import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { signPayload, generateQRCodeDataURL } from "@c3/qr";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("event_registrations")
    .select("id, qr_code_id, user_id, email")
    .eq("id", id)
    .single();

  if (fetchError || !registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Verify ownership
  if (registration.user_id !== user.id) {
    const { data: profile } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const userEmail = profile?.user?.email?.toLowerCase();
    if (userEmail !== registration.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const ticketSecret = process.env.TICKET_SECRET;
  if (!ticketSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Issue a fresh UUID — the old qr_code_id is now dead
  const newQrCodeId = randomUUID();

  const { error: updateError } = await supabaseAdmin
    .from("event_registrations")
    .update({ qr_code_id: newQrCodeId })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to regenerate QR" }, { status: 500 });
  }

  const payload = signPayload("ticket", newQrCodeId, ticketSecret);
  const dataUrl = await generateQRCodeDataURL(payload);

  return NextResponse.json({ data: { dataUrl } });
}
