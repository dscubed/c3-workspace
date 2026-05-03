import { supabaseAdmin } from "./admin";

function json(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init);
}

/** Only these table/view names are allowed to prevent injection. */
const ALLOWED_TABLES = new Set(["profiles", "profile_detail"]);

/**
 * Shared handler for GET /api/profiles/fetch route.
 *
 * Supports:
 *   - `id`     — single profile fetch
 *   - `ids`    — batch fetch (comma-separated)
 *   - `search` — ilike search on first_name / last_name with word splitting
 *   - `filter` — JSON equality filters, e.g. `{"account_type":"organisation"}`
 *   - `table`  — "profiles" (default) or "profile_detail"
 *   - `select` — comma-separated columns (default: "*")
 *   - `limit`  / `offset` — pagination for search/list modes (default: 10 / 0)
 *   - `excludeId` — exclude a single ID from search/list results
 */
export async function handleProfileFetch(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table") || "profiles";
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");
    const select = searchParams.get("select") || "*";
    const search = searchParams.get("search");
    const filterParam = searchParams.get("filter");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const excludeId = searchParams.get("excludeId");

    if (!ALLOWED_TABLES.has(table)) {
      return json(
        { error: `Invalid table. Allowed: ${[...ALLOWED_TABLES].join(", ")}` },
        { status: 400 },
      );
    }

    // Parse optional equality filters
    let filters: Record<string, string> = {};
    if (filterParam) {
      try {
        filters = JSON.parse(filterParam);
      } catch {
        return json({ error: "Invalid filter JSON" }, { status: 400 });
      }
    }

    // --- Search mode ---
    if (search) {
      let query = supabaseAdmin
        .from(table)
        .select(select)
        .range(offset, offset + limit - 1);

      const words = search.trim().split(/\s+/).filter(Boolean);
      for (const word of words) {
        const escaped = word.replace(/[%_]/g, "\\$&");
        query = query.or(
          `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%`,
        );
      }

      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }

      if (excludeId) query = query.neq("id", excludeId);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    // --- Batch fetch mode ---
    if (ids) {
      const idArray = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (idArray.length === 0) {
        return json({ error: "ids parameter is empty" }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from(table)
        .select(select)
        .in("id", idArray);
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    // --- Single fetch mode ---
    if (id) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select(select)
        .eq("id", id)
        .single();
      if (error) {
        return json(
          { error: error.message },
          { status: error.code === "PGRST116" ? 404 : 500 },
        );
      }
      return json({ data });
    }

    // --- List mode (filters only, no search term) ---
    if (Object.keys(filters).length > 0) {
      let query = supabaseAdmin
        .from(table)
        .select(select)
        .range(offset, offset + limit - 1);

      for (const [key, val] of Object.entries(filters)) {
        query = query.eq(key, val);
      }
      if (excludeId) query = query.neq("id", excludeId);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    return json(
      { error: "Provide 'id', 'ids', 'search', or 'filter' parameter" },
      { status: 400 },
    );
  } catch {
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
