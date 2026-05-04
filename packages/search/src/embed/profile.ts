import type { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIEmbedding } from "../embeddings/openai";
import { chunkProfile } from "../chunkers/profile";
import type { ProfileRow, EmbedResult } from "../types";

const EMBED_MODEL = "text-embedding-3-small";

/**
 * Fetches a profile by ID, builds a bio chunk, embeds it, and upserts
 * to search_embeddings. Works for users, clubs, and organisations.
 *
 * @param supabase   Authenticated Supabase client (service role recommended)
 * @param openaiKey  OpenAI API key
 * @param profileId  UUID of the profile to embed
 */
export async function embedProfile(
  supabase: SupabaseClient,
  openaiKey: string,
  profileId: string,
): Promise<EmbedResult> {
  // ── Fetch profile ─────────────────────────────────────────────────────────

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profileData) {
    return {
      chunksTotal: 0,
      upserted: 0,
      error: profileError?.message ?? `Profile ${profileId} not found`,
    };
  }

  const chunks = chunkProfile(profileData as ProfileRow);

  // ── Embed ─────────────────────────────────────────────────────────────────

  const embedder = new OpenAIEmbedding({
    apiKey: openaiKey,
    model: EMBED_MODEL,
  });
  let embedding: number[];
  try {
    embedding = await embedder.embed(chunks[0]!.text);
  } catch (e) {
    return {
      chunksTotal: 1,
      upserted: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // ── Upsert ────────────────────────────────────────────────────────────────

  const chunk = chunks[0]!;
  const { error: upsertError, count } = await supabase
    .from("search_embeddings")
    .upsert(
      [
        {
          entity_type: chunk.entityType,
          entity_id: chunk.entityId,
          chunk_type: chunk.chunkType,
          chunk_index: chunk.chunkIndex,
          title: chunk.title,
          chunk_text: chunk.text,
          embedding: `[${embedding.join(",")}]`,
          metadata: chunk.metadata ?? {},
        },
      ],
      {
        onConflict: "entity_id,chunk_type,chunk_index",
        count: "exact",
      },
    );

  if (upsertError) {
    return { chunksTotal: 1, upserted: 0, error: upsertError.message };
  }

  return { chunksTotal: 1, upserted: count ?? 1 };
}
