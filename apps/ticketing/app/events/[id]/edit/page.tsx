import { notFound } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { fetchEventForEdit } from "@/lib/event-server/check-access";
import Unauthorized from "./Unauthorized";
import EventForm from "@/components/event-form/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await fetchEventForEdit(id, user?.id ?? null);

  if (!result.allowed) {
    if (result.reason === "not_found") {
      notFound();
    }
    return <Unauthorized reason={result.reason} eventId={id} />;
  }

  return <EventForm eventId={id} data={result.data} />;
}
