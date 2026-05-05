import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { fetchUserRegistrations } from "@c3/supabase";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const registrations = await fetchUserRegistrations(user.id);
    return NextResponse.json({ data: registrations });
  } catch (err) {
    console.error("GET /api/registrations error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
