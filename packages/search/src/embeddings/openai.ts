import OpenAI from "openai";

export interface OpenAIEmbeddingConfig {
  apiKey: string;
  /**
   * Model to use. Defaults to "text-embedding-3-small".
   * Must match the model used when the documents were indexed.
   */
  model?: string;
  /**
   * Reduced dimension output (supported by v3 models).
   * Omit to use the model's native dimensionality (1536 for small, 3072 for large).
   */
  dimensions?: number;
}

const NATIVE_DIMS: Record<string, number> = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "text-embedding-ada-002": 1536,
};

export class OpenAIEmbedding {
  readonly name: string;
  readonly dimensions: number;

  private readonly client: OpenAI;
  private readonly model: string;
  private readonly requestedDimensions: number | undefined;

  constructor(config: OpenAIEmbeddingConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? "text-embedding-3-small";
    this.requestedDimensions = config.dimensions;
    this.dimensions = config.dimensions ?? NATIVE_DIMS[this.model] ?? 1536;
    this.name = `openai/${this.model}`;
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: text,
      ...(this.requestedDimensions
        ? { dimensions: this.requestedDimensions }
        : {}),
    });
    return res.data[0]!.embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      ...(this.requestedDimensions
        ? { dimensions: this.requestedDimensions }
        : {}),
    });
    return res.data.map((d) => d.embedding);
  }
}
