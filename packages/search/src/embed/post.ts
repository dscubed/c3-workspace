import type { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIEmbedding } from "../embeddings/openai";
import { chunkInstagramPost } from "../chunkers/instagram";
import type { InstagramPostRow, EmbedResult } from "../types";

const EMBED_MODEL = "text-embedding-3-small";

/**
 * Fetches an Instagram post by ID (shortcode), builds a chunk, embeds it,
 * and upserts to search_embeddings.
 *
 * Resolves the owner display name via instagram_club_fetches → profiles.
 *
 * @param supabase   Authenticated Supabase client (service role recommended)
 * @param openaiKey  OpenAI API key
 * @param postId     Shortcode (id) of the Instagram post
 */
export async function embedPost(
  supabase: SupabaseClient,
  openaiKey: string,
  postId: string,
): Promise<EmbedResult> {
  // ── Fetch post ─────────────────────────────────────────────────────────────

  const { data: postData, error: postError } = await supabase
    .from("instagram_posts")
    .select(
      "id, posted_by, caption, timestamp, location, images, collaborators",
    )
    .eq("id", postId)
    .single();

  if (postError || !postData) {
    return {
      chunksTotal: 0,
      upserted: 0,
      error: postError?.message ?? `Post ${postId} not found`,
    };
  }

  const post = postData as InstagramPostRow;

  // ── Resolve owner name ────────────────────────────────────────────────────

  let ownerName: string | undefined;
  if (post.posted_by) {
    const { data: fetchData } = await supabase
      .from("instagram_club_fetches")
      .select("instagram_slug, profiles(full_name, username)")
      .eq("instagram_slug", post.posted_by)
      .single();

    const profile = fetchData?.profiles as
      | { full_name?: string; username?: string }
      | null
      | undefined;
    ownerName = profile?.full_name ?? profile?.username ?? undefined;
  }

  const chunks = chunkInstagramPost(post, ownerName);

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
