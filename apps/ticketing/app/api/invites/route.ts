import { NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

/* ================================================================
   GET /api/invites
   Query params:
     - direction: "incoming" (default) | "outgoing"
     - status: filter by host status
================================================================ */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction") ?? "incoming";
    const statusFilter = searchParams.get("status");

    const select = `id, event_id, inviter_id, profile_id, status, sort_order, created_at,
      events:event_id(id, name, is_online, category, status, event_images(url, sort_order)),
      inviter:inviter_id(id, first_name, last_name, avatar_url),
      invitee:profile_id(id, first_name, last_name, avatar_url)`;

    let query = supabaseAdmin
      .from("event_hosts")
      .select(select)
      .order("sort_order", { ascending: true });

    if (direction === "outgoing") {
      query = query.eq("inviter_id", user.id).neq("profile_id", user.id).eq("status", "pending");
    } else {
      query = query.eq("profile_id", user.id).in("status", ["pending", "accepted"]);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch invites:", error);
      return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
    }

    // Derive start date from occurrences for events lacking it on the row
    const eventIds = [...new Set((data ?? []).map((r: any) => r.event_id as string))];
    if (eventIds.length > 0) {
      const { data: occs } = await supabaseAdmin
        .from("event_occurrences")
        .select("event_id, start")
        .in("event_id", eventIds)
        .order("start");
      if (occs) {
        const firstOccByEvent = new Map<string, string>();
        for (const o of occs) {
          if (!firstOccByEvent.has(o.event_id as string)) {
            firstOccByEvent.set(o.event_id as string, o.start as string);
          }
        }
        for (const row of data ?? []) {
          const e = (row as any).events;
          if (e) {
            e.start = firstOccByEvent.get(e.id) ?? null;
          }
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
