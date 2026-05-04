// ─── Shared types for the search / embedding package ─────────────────────────

import type { SectionData, SectionType } from "@c3/types";

// Re-export so consumers can import section types from the search package too.
export type { SectionData, SectionType };

/**
 * Alias kept for backwards-compat within this package.
 * Adding a new value to SectionType in @c3/types will cause a compile error
 * in renderSectionContent until a case is added to its switch statement.
 */
export type EventSectionType = SectionType;

/**
 * A single piece of text ready to be embedded and stored in search_embeddings.
 * Produced by entity chunkers, consumed by embed functions.
 */
export interface Chunk {
  entityType: "profile" | "event" | "instagram_post";
  entityId: string;
  /** Discriminates what part of the entity this chunk represents. */
  chunkType: string;
  /**
   * Zero-based position for chunk_types that can appear multiple times
   * (e.g. individual event sections).  Single-chunk types always use 0.
   */
  chunkIndex: number;
  /** Display name shown in search results (entity title). */
  title: string;
  /** The raw markdown text to embed. */
  text: string;
  /** Extra data stored alongside the chunk (not embedded). */
  metadata?: Record<string, unknown>;
}

// ─── Raw Supabase row shapes ──────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  /** 'user' | 'club' | 'organisation' */
  profile_type: string | null;
  university: string | null;
  location: string | null;
  tags: string[] | null;
  category: string | null;
  website: string | null;
}

export interface EventRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  is_online: boolean | null;
  organiser_id: string | null;
  university?: string | null;
}

export interface EventVenueRow {
  id: string;
  event_id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postcode: string | null;
  online_link: string | null;
  instructions: string | null;
}

export interface EventTicketTierRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  tier_type: string | null;
  capacity: number | null;
  is_free: boolean | null;
}

export interface EventSectionRow {
  id: string;
  event_id: string;
  section_type: EventSectionType;
  title: string | null;
  /** Typed content payload — shape is determined by section_type. */
  content: SectionData | null;
  display_order: number | null;
}

export interface EventHostRow {
  id: string;
  event_id: string;
  profile_id: string | null;
  name: string | null;
  role: string | null;
  bio: string | null;
}

export interface InstagramPostRow {
  id: string;
  posted_by: string | null;
  caption: string | null;
  timestamp: number | null;
  location: string | null;
  images: string[] | null;
  collaborators: string[] | null;
}

// ─── Result returned by each embed* function ─────────────────────────────────

export interface EmbedResult {
  chunksTotal: number;
  upserted: number;
  error?: string;
}
