import type { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIEmbedding } from "../embeddings/openai";
import { chunkEvent } from "../chunkers/event";
import type {
  EventRow,
  EventVenueRow,
  EventTicketTierRow,
  EventSectionRow,
  EventHostRow,
  EmbedResult,
} from "../types";

const EMBED_MODEL = "text-embedding-3-small";

/**
 * Fetches an event by ID, builds all chunks (overview, venue, tickets,
 * hosts, sections), embeds them with OpenAI, and upserts to search_embeddings.
 *
 * @param supabase   Authenticated Supabase client (service role recommended)
 * @param openaiKey  OpenAI API key
 * @param eventId    UUID of the event to embed
 */
export async function embedEvent(
  supabase: SupabaseClient,
  openaiKey: string,
  eventId: string,
): Promise<EmbedResult> {
  // ── Fetch event + all related rows in parallel ─────────────────────────────

  const [
    { data: eventData, error: eventError },
    venues,
    tiers,
    sections,
    hosts,
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single(),
    supabase
      .from("event_venues")
      .select("*")
      .eq("event_id", eventId)
      .then((r) => (r.data ?? []) as EventVenueRow[]),
    supabase
      .from("event_ticket_tiers")
      .select("*")
      .eq("event_id", eventId)
      .then((r) => (r.data ?? []) as EventTicketTierRow[]),
    supabase
      .from("event_sections")
      .select("*")
      .eq("event_id", eventId)
      .then((r) => (r.data ?? []) as EventSectionRow[]),
    supabase
      .from("event_hosts")
      .select("*")
      .eq("event_id", eventId)
      .then((r) => (r.data ?? []) as EventHostRow[]),
  ]);

  if (eventError || !eventData) {
    return {
      chunksTotal: 0,
      upserted: 0,
      error: eventError?.message ?? `Event ${eventId} not found`,
    };
  }

  const chunks = chunkEvent({
    event: eventData as EventRow,
    venues,
    ticketTiers: tiers,
    sections,
    hosts,
  });

  if (chunks.length === 0) {
    return { chunksTotal: 0, upserted: 0 };
  }

  // ── Embed ─────────────────────────────────────────────────────────────────

  const embedder = new OpenAIEmbedding({
    apiKey: openaiKey,
    model: EMBED_MODEL,
  });
  let embeddings: number[][];
  try {
    embeddings = await embedder.embedBatch(chunks.map((c) => c.text));
  } catch (e) {
    return {
      chunksTotal: chunks.length,
      upserted: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // ── Upsert ────────────────────────────────────────────────────────────────

  const rows = chunks.map((chunk, j) => ({
    entity_type: chunk.entityType,
    entity_id: chunk.entityId,
    chunk_type: chunk.chunkType,
    chunk_index: chunk.chunkIndex,
    title: chunk.title,
    chunk_text: chunk.text,
    embedding: `[${embeddings[j]!.join(",")}]`,
    metadata: chunk.metadata ?? {},
  }));

  const { error: upsertError, count } = await supabase
    .from("search_embeddings")
    .upsert(rows, {
      onConflict: "entity_id,chunk_type,chunk_index",
      count: "exact",
    });

  if (upsertError) {
    return {
      chunksTotal: chunks.length,
      upserted: 0,
      error: upsertError.message,
    };
  }

  return { chunksTotal: chunks.length, upserted: count ?? rows.length };
}
