import OpenAI from "openai";

const TIMEOUT_MS = 3000;

/**
 * HyDE (Hypothetical Document Embedding) query rewriting.
 *
 * Given a user's search query, asks an LLM to produce a short passage that
 * reads like an ideal matching document from the corpus. The hypothetical
 * document is then embedded instead of the raw query, producing a vector
 * much closer to real stored documents in embedding space.
 *
 * If the LLM call exceeds 3 s the original query is returned so search
 * latency is never blocked.
 */
export async function hydeRewrite(
  openai: OpenAI,
  query: string,
  model = "gpt-4o-mini",
): Promise<string> {
  const trimmed = query.trim();

  const timeout = new Promise<string>((resolve) =>
    setTimeout(() => resolve(trimmed), TIMEOUT_MS),
  );

  const rewrite = openai.responses
    .create({
      model,
      instructions: [
        "You are a semantic search assistant for a university social platform.",
        "The search corpus contains student profiles, clubs/organisations, and events.",
        "Your job: given a user's search query, produce ONE short passage (2-4 sentences)",
        "that reads like an ideal matching document from that corpus.",
        "Use concrete nouns — names, roles, club types, event activities.",
        "If the query is a single word, a greeting, a test string, or otherwise too vague",
        "to expand into a meaningful passage, respond with the query verbatim and nothing else.",
        "Never add preamble, commentary, or meta-text.",
      ].join(" "),
      input: trimmed,
      max_output_tokens: 150,
      temperature: 0,
    })
    .then((r) => {
      const text = (r as { output_text?: string }).output_text?.trim();
      return text || trimmed;
    })
    .catch(() => trimmed);

  return Promise.race([rewrite, timeout]);
}
