import OpenAI from "openai";
import type { SearchResult } from "./vector-search";

export interface CrossEncoderOptions {
  /**
   * Chat model used to score relevance.
   * Default: "gpt-4o-mini"
   */
  model?: string;
  /**
   * How many top candidates (by similarity score) to send to the LLM.
   * Candidates beyond this cap are appended at the bottom in their original order.
   * Default: 20.
   */
  topK?: number;
}

/**
 * Cross-encoder reranker backed by an OpenAI chat model.
 *
 * 1. Picks the top `topK` candidates by similarity score.
 * 2. Sends them in a single chat completion — query + numbered list of
 *    (name, snippet) pairs — asking the model to return a JSON array of
 *    IDs sorted from most to least relevant.
 * 3. Scores results as  (topK - rank) / topK  so #1 = 1.0, #2 ≈ 0.95, …
 * 4. Falls back to original order on any error.
 *
 * The prompt is copied verbatim from search-playground/src/rerankers/crossencoder.ts.
 */
export async function crossEncoderRerank(
  openai: OpenAI,
  query: string,
  results: SearchResult[],
  options: CrossEncoderOptions = {},
): Promise<SearchResult[]> {
  if (results.length === 0) return results;

  const { model = "gpt-4o-mini", topK = 20 } = options;

  const toRank = results.slice(0, topK);
  const tail = results.slice(topK);

  let rankedIds: string[];

  try {
    rankedIds = await llmRank(openai, model, query, toRank);
  } catch (e) {
    console.error(
      "[cross-encoder] Failed, falling back to original order:",
      e instanceof Error ? e.message : String(e),
    );
    return results;
  }

  // Ensure all toRank IDs are present (model may omit or hallucinate some)
  const seen = new Set(rankedIds);
  for (const r of toRank) {
    if (!seen.has(r.id)) rankedIds.push(r.id);
  }

  const lookup = new Map(results.map((r) => [r.id, r]));

  const reranked: SearchResult[] = rankedIds
    .map((id, rank) => {
      const original = lookup.get(id);
      if (!original) return null;
      return {
        ...original,
        similarity: Math.max(0, (topK - rank) / topK),
      };
    })
    .filter((r): r is SearchResult => r !== null);

  // Append anything beyond topK in original order
  for (const r of tail) {
    reranked.push(r);
  }

  return reranked;
}

async function llmRank(
  openai: OpenAI,
  model: string,
  query: string,
  candidates: SearchResult[],
): Promise<string[]> {
  const numbered = candidates
    .map((r, i) => {
      const snippet = r.snippet?.slice(0, 120) ?? "";
      return `${i + 1}. [${r.id}] ${r.name}${snippet ? ` — ${snippet}` : ""}`;
    })
    .join("\n");

  const prompt = `You are a search relevance expert. Given the query and candidates below, return a JSON array of candidate IDs sorted from most relevant to least relevant. Include every ID exactly once. Return ONLY the JSON array, nothing else.

Query: "${query}"

Candidates:
${numbered}`;

  const res = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  // Model should return {"ranked": [...]} or just [...] — handle both.
  const parsed = JSON.parse(raw) as unknown;
  const arr: unknown = Array.isArray(parsed)
    ? parsed
    : ((parsed as Record<string, unknown>)["ranked"] ??
      Object.values(parsed as object)[0]);

  if (!Array.isArray(arr)) {
    throw new Error(`Unexpected LLM response shape: ${raw.slice(0, 200)}`);
  }

  return (arr as unknown[]).map(String);
}
