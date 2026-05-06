import { notFound, redirect } from "next/navigation";
import { resolveEventByIdOrSlug } from "@/lib/api/fetchEventServer";
import { createClient } from "@c3/supabase/server";
import CheckoutForm from "@/components/events/checkout/checkout-form/CheckoutForm";

/**
 * Returns true if registration/checkout is still open.
 * Open from any time until the event ends.
 * If no end time is set, open until end of the event's start day.
 * If neither is set, always open.
 */
function isWithinAvailabilityWindow(
  startUtc: string | null,
  endUtc: string | null,
): boolean {
  const now = Date.now();

  if (endUtc) {
    return now <= new Date(endUtc).getTime();
  }

  // No end time — open until end of the start day
  if (startUtc) {
    const startDate = new Date(startUtc);
    const endOfDay = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    return now <= endOfDay.getTime();
  }

  return true;
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ── Verify the event exists and is published ── */
  const event = await resolveEventByIdOrSlug(id);
  if (!event) notFound();

  /* ── Redirect if already registered ── */
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) redirect("/dashboard/tickets");
  }

  /* ── Check availability window ── */
  const withinWindow = isWithinAvailabilityWindow(
    event.start ?? null,
    event.end ?? null,
  );

  return (
    <CheckoutForm
      eventId={event.id}
      mode="preview"
      availabilityWindowOpen={withinWindow}
    />
  );
}
