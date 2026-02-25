// @ts-expect-error No type definitions available for cosine-similarity
import cosineSimilarity from "cosine-similarity";
import {
  EmbeddedItem,
  HLDComponent,
  MatchedRequirement,
  Requirement,
} from "./types";

export class AIMatcher {
  /**
   * Deterministically calculates the cosine similarity between two vectors.
   * Uses the standard npm `cosine-similarity` library.
   * Returns a value between -1 and 1.
   */
  public calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    return cosineSimilarity(vecA, vecB) || 0;
  }

  /**
   * Removes duplicate requirements based on embedding similarity > 0.95.
   */
  public deduplicateRequirements(
    requirements: Requirement[],
    vectors: number[][],
  ): EmbeddedItem<Requirement>[] {
    const embeddedItems: EmbeddedItem<Requirement>[] = requirements.map(
      (item, i) => ({ item, vector: vectors[i] }),
    );
    return this.deduplicateEmbeddedItems(embeddedItems, 0.95);
  }

  /**
   * Removes duplicate components based on embedding similarity > 0.95.
   */
  public deduplicateComponents(
    components: HLDComponent[],
    vectors: number[][],
  ): EmbeddedItem<HLDComponent>[] {
    const embeddedItems: EmbeddedItem<HLDComponent>[] = components.map(
      (item, i) => ({ item, vector: vectors[i] }),
    );
    return this.deduplicateEmbeddedItems(embeddedItems, 0.95);
  }

  /**
   * Matches deduplicated individual requirements to the closest implementation component.
   */
  public matchRequirementsToComponents(
    requirements: EmbeddedItem<Requirement>[],
    components: EmbeddedItem<HLDComponent>[],
  ): MatchedRequirement[] {
    return requirements.map((req) => {
      let bestMatch: HLDComponent | undefined = undefined;
      let highestScore = -1; // Minimum possible cosine similarity

      for (const comp of components) {
        const score = this.calculateCosineSimilarity(req.vector, comp.vector);

        if (score > highestScore) {
          highestScore = score;
          bestMatch = comp.item;
        }
      }

      return {
        requirement: req.item,
        bestMatchComponent: bestMatch,
        similarityScore: highestScore,
      };
    });
  }

  /**
   * Internal deduplication logic: O(n^2) check. If item A and item B
   * have cosine similarity > threshold, the later item is discarded.
   */
  private deduplicateEmbeddedItems<T>(
    items: EmbeddedItem<T>[],
    threshold: number,
  ): EmbeddedItem<T>[] {
    const uniqueItems: EmbeddedItem<T>[] = [];

    for (const current of items) {
      let isDuplicate = false;

      for (const unique of uniqueItems) {
        const score = this.calculateCosineSimilarity(
          current.vector,
          unique.vector,
        );
        if (score > threshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueItems.push(current);
      }
    }

    return uniqueItems;
  }
}
