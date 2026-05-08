import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { fetchUserRegistrations } from "@c3/supabase";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const all = await fetchUserRegistrations(user.id);
    const now = new Date().toISOString();

    const upcoming = all
      .filter((r) => r.event_start && r.event_start > now)
      .sort((a, b) => (a.event_start! < b.event_start! ? -1 : 1))
      .slice(0, 3);

    return NextResponse.json({ data: upcoming });
  } catch (err) {
    console.error("GET /api/registrations/upcoming error:", err);
    return NextResponse.json({ data: [] });
  }
}
