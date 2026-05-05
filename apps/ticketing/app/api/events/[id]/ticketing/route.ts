import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";
import { checkEventPermission } from "@/lib/auth/clubAdmin";

/* ================================================================
   GET /api/events/[id]/ticketing
   Returns custom checkout fields for the event.
================================================================ */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const fields = await supabaseAdmin
      .from("event_ticketing_fields")
      .select("*")
      .eq("event_id", id)
      .order("sort_order");

    return NextResponse.json({
      data: {
        fields: fields.data ?? [],
      },
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/ticketing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   PATCH /api/events/[id]/ticketing
   Replaces all custom checkout fields for the event.
================================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const allowed = await checkEventPermission(id, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fields } = body as {
      fields: {
        label: string;
        input_type: string;
        placeholder?: string;
        required?: boolean;
        options?: string[];
        sort_order: number;
      }[];
    };

    await supabaseAdmin
      .from("event_ticketing_fields")
      .delete()
      .eq("event_id", id);

    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        event_id: id,
        label: f.label,
        input_type: f.input_type,
        placeholder: f.placeholder ?? null,
        required: f.required ?? false,
        options: f.options ?? null,
        sort_order: f.sort_order ?? i,
      }));

      const { error } = await supabaseAdmin
        .from("event_ticketing_fields")
        .insert(rows);

      if (error) {
        console.error("[PATCH ticketing] fields insert error:", error);
        return NextResponse.json(
          { error: "Failed to update fields" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/events/[id]/ticketing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
