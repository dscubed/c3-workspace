import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { fetchUserRegisteredEventIds } from "@c3/supabase";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const eventIds = await fetchUserRegisteredEventIds(user.id);
    return NextResponse.json({ data: eventIds });
  } catch (err) {
    console.error("GET /api/registrations error:", err);
    return NextResponse.json({ data: [] });
  }
}
