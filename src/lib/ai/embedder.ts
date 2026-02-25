import { embedMany } from "ai";
import { google } from "@ai-sdk/google";

/**
 * Service to generate vector embeddings mathematically mapping strings
 * to a high-dimensional vector space using Gemini text embeddings.
 */
export class AIEmbedder {
  /**
   * Generates embedding vectors for an array of texts.
   * @param texts Array of string descriptions to embed.
   * @returns Array of vectors (each vector is a number array).
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    try {
      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel("text-embedding-004"),
        values: texts,
      });
      return embeddings;
    } catch (error) {
      console.error("AIEmbedder: Failed to generate embeddings:", error);
      // Fallback: Return zeroed arrays to avoid complete crash
      // 768 is the typical dimension for text-embedding-004
      return texts.map(() => new Array(768).fill(0));
    }
  }
}
