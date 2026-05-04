import { SupabaseClient } from "@supabase/supabase-js";
import { embedProfile } from "@c3/search";

/**
 * Embeds a user profile into the pgvector search_embeddings table.
 * Replaces the old OpenAI vector store upload.
 *
 * @deprecated - Prefer calling embedProfile directly from @c3/search.
 *   This wrapper is kept for backwards compatibility.
 */
export async function uploadProfileToVectorStore({
  userId,
  supabase,
}: {
  userId: string;
  supabase: SupabaseClient;
}): Promise<void> {
  const result = await embedProfile(supabase, process.env.OPENAI_API_KEY!, userId);
  if (result.error) {
    throw new Error(result.error);
  }
}