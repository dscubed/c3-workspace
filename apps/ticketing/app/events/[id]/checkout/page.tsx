import { notFound, redirect } from "next/navigation";
import { resolveEventByIdOrSlug } from "@/lib/event-server/resolve-slug";
import { createClient } from "@c3/supabase/server";
import CheckoutForm from "@/components/events/checkout/checkout-form/CheckoutForm";

function isWithinAvailabilityWindow(
  startUtc: string | null,
  endUtc: string | null,
): boolean {
  const now = Date.now();
  if (endUtc) return now <= new Date(endUtc).getTime();
  if (startUtc) {
    const startDate = new Date(startUtc);
    const endOfDay = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        23, 59, 59, 999,
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

  const event = await resolveEventByIdOrSlug(id);
  if (!event) notFound();

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

  const firstOcc = event.occurrences?.[0];
  const withinWindow = isWithinAvailabilityWindow(
    firstOcc?.start ?? null,
    firstOcc?.end ?? null,
  );

  return (
    <CheckoutForm
      eventId={event.id}
      mode="preview"
      availabilityWindowOpen={withinWindow}
    />
  );
}
