import { supabaseAdmin as supabase } from "@c3/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TABLES = new Set(["profiles", "profile_detail"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table") || "profiles";
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");
    const select = searchParams.get("select") || "*";

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: `Invalid table. Allowed: ${[...ALLOWED_TABLES].join(", ")}` },
        { status: 400 },
      );
    }

    if (ids) {
      const idArray = ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (idArray.length === 0) {
        return NextResponse.json({ error: "ids parameter is empty" }, { status: 400 });
      }
      const { data, error } = await supabase.from(table).select(select).in("id", idArray);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (id) {
      const { data, error } = await supabase.from(table).select(select).eq("id", id).single();
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.code === "PGRST116" ? 404 : 500 },
        );
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: "Provide 'id' or 'ids' parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Profile fetch route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
