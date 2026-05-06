import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

/* ================================================================
   GET /api/clubs/search?q=chess&limit=18&cursor=<base64>
   Full-text search over organisation profiles with cursor pagination.
   Returns: { items: ClubResult[], cursor: string | null }
================================================================ */

export interface ClubResult {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString("base64");
}

function decodeCursor(cursor: string): number {
  try {
    const { offset } = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf-8"),
    );
    return typeof offset === "number" ? offset : 0;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    /* Auth check */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "18"), 50);
    const cursor = searchParams.get("cursor");
    const offset = cursor ? decodeCursor(cursor) : 0;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, first_name, avatar_url")
      .eq("account_type", "organisation")
      .order("first_name", { ascending: true })
      .range(offset, offset + limit); // fetch limit+1 to probe hasMore

    if (q.length > 0) {
      query = query.ilike("first_name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Club search error:", error);
      return NextResponse.json(
        { error: "Failed to search clubs" },
        { status: 500 },
      );
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const items: ClubResult[] = pageRows.map((r) => ({
      id: r.id,
      first_name: r.first_name ?? "",
      avatar_url: r.avatar_url ?? null,
    }));

    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return NextResponse.json({ items, cursor: nextCursor });
  } catch (err) {
    console.error("GET /api/clubs/search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
