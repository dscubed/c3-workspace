import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";
import { fetchEventServer } from "@/lib/api/fetchEventServer";
import CheckoutForm from "@/components/events/checkout/checkout-form/CheckoutForm";

const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_BASE_URL ?? "http://localhost:3000/auth/sso";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ── Require auth — redirect unsigned users to Connect3 SSO ── */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTo = `${SITE_URL}/events/${id}/checkout`;
    redirect(`${SSO_BASE_URL}?redirect_to=${encodeURIComponent(redirectTo)}`);
  }

  /* ── Verify the event exists and is published ── */
  const event = await fetchEventServer(id);
  if (!event) notFound();

  /* ── Verify ticketing is enabled ── */
  const { data: ticketingRow } = await supabaseAdmin
    .from("events")
    .select("ticketing_enabled")
    .eq("id", id)
    .single();

  if (!ticketingRow?.ticketing_enabled) {
    notFound();
  }

  return <CheckoutForm eventId={id} mode="preview" />;
}
