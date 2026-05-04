// Embed functions — call these from server actions / API routes
export { embedEvent } from "./embed/event";
export { embedPost } from "./embed/post";
export { embedProfile } from "./embed/profile";

// Chunkers — exposed for testing or custom pipelines
export { chunkEvent } from "./chunkers/event";
export type { EventBundle } from "./chunkers/event";
export { chunkProfile } from "./chunkers/profile";
export { chunkInstagramPost } from "./chunkers/instagram";

// Embedding provider
export { OpenAIEmbedding } from "./embeddings/openai";
export type { OpenAIEmbeddingConfig } from "./embeddings/openai";

// Vector search
export { vectorSearch } from "./search/vector-search";
export type { SearchResult, VectorSearchOptions } from "./search/vector-search";

// HyDE query rewriting
export { hydeRewrite } from "./search/hyde";

// Cross-encoder reranking
export { crossEncoderRerank } from "./search/crossencoder";
export type { CrossEncoderOptions } from "./search/crossencoder";

// Shared types
export type {
  Chunk,
  EmbedResult,
  ProfileRow,
  EventRow,
  EventVenueRow,
  EventTicketTierRow,
  EventSectionRow,
  EventHostRow,
  InstagramPostRow,
} from "./types";
