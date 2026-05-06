import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { signPayload, generateQRCodeDataURL } from "@c3/qr";

export async function GET(
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

  const { data: registration, error } = await supabaseAdmin
    .from("event_registrations")
    .select("id, qr_code_id, user_id, email")
    .eq("id", id)
    .single();

  if (error || !registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Verify ownership — match by user_id or by email for claimed guest registrations
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

  const payload = signPayload("ticket", registration.qr_code_id, ticketSecret);
  const dataUrl = await generateQRCodeDataURL(payload);

  return NextResponse.json({ data: { dataUrl } });
}
