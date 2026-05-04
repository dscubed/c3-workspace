import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { OpenAIEmbedding } from "../embeddings/openai";
import { hydeRewrite } from "./hyde";
import { crossEncoderRerank, type CrossEncoderOptions } from "./crossencoder";

export interface SearchResult {
  /** entity_id from search_embeddings */
  id: string;
  /** entity_type from search_embeddings */
  type: string;
  name: string;
  snippet: string;
  similarity: number;
  /** metadata JSONB column — includes university, profile_type, category, etc. */
  metadata: Record<string, unknown> | null;
}

export interface VectorSearchOptions {
  /** Filter to a single entity type */
  entityType?: "profile" | "event" | "instagram_post";
  matchThreshold?: number;
  matchCount?: number;
  /**
   * HyDE (Hypothetical Document Embedding) query rewriting.
   * Asks an LLM to generate a short hypothetical document before embedding.
   * Falls back to original query on timeout (3 s) or error.
   * Default: false.
   */
  useHyde?: boolean;
  /** Model used for HyDE rewriting. Default: "gpt-4o-mini" */
  hydeModel?: string;
  /**
   * Cross-encoder reranking via LLM after pgvector retrieval.
   * Falls back to original similarity order on error.
   * Default: false.
   */
  useCrossEncoder?: boolean;
  crossEncoder?: CrossEncoderOptions;
}

/**
 * Embeds `query` with text-embedding-3-small then calls the
 * `vector_search_filtered` Supabase RPC to find similar chunks.
 *
 * Optionally applies HyDE query rewriting before embedding and
 * cross-encoder reranking after retrieval.
 *
 * Requires the `vector_search_filtered` function to be installed in Postgres
 * (see the search_embeddings migration).
 */
export async function vectorSearch(
  supabase: SupabaseClient,
  openaiKey: string,
  query: string | string[],
  options: VectorSearchOptions = {},
): Promise<SearchResult[]> {
  const {
    entityType,
    matchThreshold = 0.3,
    matchCount = 20,
    useHyde = false,
    hydeModel = "gpt-4o-mini",
    useCrossEncoder = false,
    crossEncoder,
  } = options;

  const queryText = Array.isArray(query) ? query.join(" ") : query;

  const openai = new OpenAI({ apiKey: openaiKey });

  // HyDE: rewrite query into a hypothetical document before embedding
  const textToEmbed = useHyde
    ? await hydeRewrite(openai, queryText, hydeModel)
    : queryText;

  const embedder = new OpenAIEmbedding({
    apiKey: openaiKey,
    model: "text-embedding-3-small",
  });
  const embedding = await embedder.embed(textToEmbed);

  const { data, error } = await supabase.rpc("vector_search_filtered", {
    query_embedding: embedding,
    filter_entity_type: entityType ?? null,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw new Error(error.message);

  const results = (data ?? []) as SearchResult[];

  // Cross-encoder reranking
  if (useCrossEncoder && results.length > 0) {
    return crossEncoderRerank(openai, queryText, results, crossEncoder);
  }

  return results;
}
