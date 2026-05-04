import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { vectorSearch } from "@c3/search";

// RRF constant - same as instant-search for consistency
const RRF_K = 60;

interface VectorResult {
  id: string;
  type: string;
  score: number;
  content: string;
}

// BM25 result shape from instant_search_bm25 RPC
interface Bm25Result {
  id: string;
  result_type: string;
  name: string;
  score: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json(
      { results: [], error: "Missing query parameter 'q'" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    // --- pgvector search across all entity types ---
    const pgVectorSearch = async (): Promise<VectorResult[]> => {
      try {
        const results = await vectorSearch(supabase, process.env.OPENAI_API_KEY!, q, {
          matchThreshold: 0.35,
          matchCount: 60,
        });

        return results.map((r): VectorResult => ({
          id: r.id,
          type: r.type,
          score: Math.round(r.similarity * 1000) / 1000,
          content: r.snippet,
        }));
      } catch (err) {
        console.error("[search] Error in pgvector search:", err);
        return [];
      }
    };

    // --- Instagram FTS ---
    const instagramSearch = async (): Promise<VectorResult[]> => {
      try {
        const { data, error } = await supabase
          .from("instagram_posts")
          .select("id, caption")
          .textSearch("caption", q, { type: "websearch", config: "english" })
          .order("timestamp", { ascending: false })
          .limit(20);

        if (error || !data) return [];

        return data.map((post) => ({
          id: post.id,
          type: "instagram_post",
          score: 0.5,
          content: post.caption ?? "",
        }));
      } catch (err) {
        console.error("[search] Error searching instagram_posts:", err);
        return [];
      }
    };

    // --- Name-match boost ---
    const nameMatchSearch = async (): Promise<VectorResult[]> => {
      try {
        const term = q.trim().toLowerCase();

        const [{ data: profiles }, { data: events }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, account_type, first_name")
            .ilike("first_name", `%${term}%`)
            .limit(10),
          supabase
            .from("events")
            .select("id, name")
            .ilike("name", `%${term}%`)
            .eq("status", "published")
            .limit(10),
        ]);

        const profileResults: VectorResult[] = (profiles ?? []).map((p) => ({
          id: p.id,
          type: p.account_type === "organisation" ? "organisation" : "user",
          score: p.first_name?.toLowerCase().startsWith(term) ? 1.0 : 0.92,
          content: p.first_name ?? "",
        }));

        const eventResults: VectorResult[] = (events ?? []).map((e) => ({
          id: e.id,
          type: "events",
          score: e.name?.toLowerCase().startsWith(term) ? 1.0 : 0.92,
          content: e.name ?? "",
        }));

        return [...profileResults, ...eventResults];
      } catch (err) {
        console.error("[search] Error in name-match search:", err);
        return [];
      }
    };

    // --- BM25 via instant_search_bm25 ---
    const bm25Search = async (): Promise<Bm25Result[]> => {
      try {
        const { data, error } = await supabase.rpc("instant_search_bm25", {
          query_text: q.trim(),
          result_limit: 40,
        });
        if (error || !data) return [];
        return data as Bm25Result[];
      } catch (err) {
        console.error("[search] Error in BM25 search:", err);
        return [];
      }
    };

    // Run everything in parallel
    const [bm25Results, vectorResults, instagramResults, nameResults] =
      await Promise.all([
        bm25Search(),
        pgVectorSearch(),
        instagramSearch(),
        nameMatchSearch(),
      ]);

    const allVectorResults = [...vectorResults, ...instagramResults, ...nameResults];

    // Build ranked lists for RRF
    // Vector list: deduplicated by id, sorted by score
    const vectorDeduped = new Map<string, VectorResult>();
    for (const r of allVectorResults) {
      const existing = vectorDeduped.get(r.id);
      if (!existing || r.score > existing.score) vectorDeduped.set(r.id, r);
    }
    const vectorRanked = [...vectorDeduped.values()].sort(
      (a, b) => b.score - a.score,
    );

    // BM25 list: already sorted by score from RPC
    const vectorRankMap = new Map(vectorRanked.map((r, idx) => [r.id, idx]));
    const bm25RankMap = new Map(bm25Results.map((r, idx) => [r.id, idx]));

    // Union of all ids
    const allIds = new Set([
      ...vectorRanked.map((r) => r.id),
      ...bm25Results.map((r) => r.id),
    ]);

    // RRF score for each id
    const rrfScored: VectorResult[] = [];
    for (const id of allIds) {
      const vectorRank = vectorRankMap.get(id);
      const bm25Rank = bm25RankMap.get(id);
      const rrfScore =
        (vectorRank !== undefined ? 1 / (RRF_K + vectorRank) : 0) +
        (bm25Rank !== undefined ? 1 / (RRF_K + bm25Rank) : 0);

      const vectorEntry = vectorDeduped.get(id);
      const bm25Entry = bm25Rank !== undefined ? bm25Results[bm25Rank] : undefined;

      // Normalise result_type: BM25 uses "event", vector uses "events"
      const type =
        vectorEntry?.type ??
        (bm25Entry?.result_type === "event"
          ? "events"
          : bm25Entry?.result_type) ??
        "user";

      rrfScored.push({
        id,
        type,
        score: Math.round(rrfScore * 10000) / 10000,
        content: vectorEntry?.content ?? bm25Entry?.name ?? "",
      });
    }

    rrfScored.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results: rrfScored });
  } catch (err) {
    console.error("[search] Unexpected error:", err);
    return NextResponse.json(
      { results: [], error: "Search failed" },
      { status: 500 },
    );
  }
}