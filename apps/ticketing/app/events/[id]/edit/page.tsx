import { notFound } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { checkEventEditAccess } from "@/lib/event-server/check-access";
import EditEventClient from "./EditEventClient";
import Unauthorized from "./Unauthorized";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  /* ── Server-side auth check ── */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await checkEventEditAccess(id, user?.id ?? null);

  if (!result.allowed) {
    if (result.reason === "not_found") {
      notFound();
    }
    return <Unauthorized reason={result.reason} eventId={id} />;
  }

  /* ── Authorized — render the form ── */
  return <EditEventClient eventId={id} />;
}
