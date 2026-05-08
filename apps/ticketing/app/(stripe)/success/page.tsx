import { redirect } from "next/navigation";
import Stripe from "stripe";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";
import { SuccessClient } from "./SuccessClient";
import { HideNavbar } from "./HideNavbar";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface EventSlim {
  id: string;
  name: string | null;
  url_slug: string | null;
  timezone: string | null;
}

function formatEventDate(start: string | null, timezone: string | null) {
  if (!start) return null;
  try {
    return new Date(start).toLocaleString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone ?? undefined,
    });
  } catch {
    return null;
  }
}

async function fetchEventSlim(eventId: string) {
  const [eventRes, imageRes, venueRes] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id, name, url_slug, timezone, event_occurrences(start)")
      .eq("id", eventId)
      .single(),
    supabaseAdmin
      .from("event_images")
      .select("url")
      .eq("event_id", eventId)
      .order("sort_order")
      .limit(1),
    supabaseAdmin
      .from("event_venues")
      .select("venue")
      .eq("event_id", eventId)
      .order("sort_order")
      .limit(1),
  ]);

  const effectiveStart =
    (eventRes.data as any)?.event_occurrences?.[0]?.start ?? null;

  return {
    event: (eventRes.data as EventSlim | null) ?? null,
    start: effectiveStart as string | null,
    thumbnailUrl: (imageRes.data?.[0]?.url as string | undefined) ?? null,
    venueName: (venueRes.data?.[0]?.venue as string | null | undefined) ?? null,
  };
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; registration_id?: string }>;
}) {
  const { session_id, registration_id } = await searchParams;

  if (!session_id && !registration_id) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  /* ── Stripe paid ticket flow ── */
  if (session_id) {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch {
      redirect("/");
    }
    if (session.payment_status !== "paid") {
      redirect("/");
    }

    const eventId = session.metadata?.event_id;
    const tierId = session.metadata?.tier_id;
    if (!eventId) redirect("/");

    const { event, thumbnailUrl, venueName, start: effectiveStart } = await fetchEventSlim(eventId);

    let tierName: string | null = null;
    if (tierId) {
      const { data: tier } = await supabaseAdmin
        .from("event_ticket_tiers")
        .select("name")
        .eq("id", tierId)
        .single();
      tierName = tier?.name ?? null;
    }

    const { data: existingReg } = await supabaseAdmin
      .from("event_registrations")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    const customerEmail =
      session.customer_details?.email ?? user?.email ?? "your email";
    const amountPaid =
      typeof session.amount_total === "number"
        ? session.amount_total / 100
        : null;
    const eventLinkPath = event?.url_slug
      ? `/events/${event.url_slug}`
      : `/events/${eventId}`;

    return (
      <>
        <HideNavbar />
        <SuccessClient
          flow="ticket"
          isAuthed={isAuthed}
          eventName={event?.name ?? "Event"}
          eventDate={formatEventDate(effectiveStart, event?.timezone ?? null)}
          venueName={venueName}
          thumbnailUrl={thumbnailUrl}
          tierName={tierName}
          amountPaid={amountPaid}
          customerEmail={customerEmail}
          eventLinkPath={eventLinkPath}
          orderId={session.id}
          registrationPending={!existingReg}
        />
      </>
    );
  }

  /* ── Free registration / free ticket flow ── */
  const { data: registration } = await supabaseAdmin
    .from("event_registrations")
    .select("id, event_id, email, type, tier_id")
    .eq("id", registration_id!)
    .single();

  if (!registration) redirect("/");

  const { event, thumbnailUrl, venueName, start: effectiveStartReg } = await fetchEventSlim(
    registration.event_id,
  );

  let tierName: string | null = null;
  if (registration.tier_id) {
    const { data: tier } = await supabaseAdmin
      .from("event_ticket_tiers")
      .select("name")
      .eq("id", registration.tier_id)
      .single();
    tierName = tier?.name ?? null;
  }

  const eventLinkPath = event?.url_slug
    ? `/events/${event.url_slug}`
    : `/events/${registration.event_id}`;

  return (
    <>
      <HideNavbar />
      <SuccessClient
        flow={registration.type === "ticket" ? "ticket" : "registration"}
        isAuthed={isAuthed}
        eventName={event?.name ?? "Event"}
        eventDate={formatEventDate(effectiveStartReg, event?.timezone ?? null)}
        venueName={venueName}
        thumbnailUrl={thumbnailUrl}
        tierName={tierName}
        amountPaid={registration.type === "ticket" ? 0 : null}
        customerEmail={registration.email ?? user?.email ?? "your email"}
        eventLinkPath={eventLinkPath}
        orderId={registration.id}
        registrationPending={false}
      />
    </>
  );
}
