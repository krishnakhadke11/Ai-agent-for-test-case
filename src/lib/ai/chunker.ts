/**
 * Implements an intelligent chunking strategy for long documents before AI processing.
 *
 * Rules implemented:
 * - First split by logical headings (e.g., "1.0", "Section 2", "•").
 * - Fall back to word counts (~800-1200 words/tokens).
 * - Apply an overlap (e.g., 150 words) if splitting by length.
 * - Never split mid-sentence.
 */
export class TextChunker {
  private maxWords: number;
  private overlapWords: number;

  constructor(maxWords: number = 800, overlapWords: number = 150) {
    this.maxWords = maxWords;
    this.overlapWords = overlapWords;
  }

  /**
   * Intelligently chunks a large string of text.
   */
  public chunkText(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    // If the entire document is smaller than maxWords, no need to chunk it at all.
    // This saves massive amounts of API calls on small documents.
    if (this.getWordCount(text) <= this.maxWords) {
      return [text.trim()];
    }

    // Attempt to split by major headings first.
    // Matches common patterns: "1. ", "1.1 ", "Section 1", "### Heading"
    const headingRegex =
      /(?:\n|^)(?:#+\s+|\d+\.\d*\s+|Section\s+\d+|[A-Z][A-Z\s]+:)/g;

    const chunks: string[] = [];
    let lastIndex = 0;

    // We use matchAll to find all heading boundaries
    const matches = Array.from(text.matchAll(headingRegex));

    if (matches.length > 1) {
      // Document has a structured heading layout.
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (match.index === undefined) continue;

        const start = i === 0 ? 0 : match.index;
        const end =
          i < matches.length - 1 && matches[i + 1].index !== undefined
            ? matches[i + 1].index
            : text.length;

        let sectionText = text.slice(start, end).trim();
        if (sectionText) {
          // If a section itself is massive, fall back to sliding window chunking for that subset
          if (this.getWordCount(sectionText) > this.maxWords) {
            chunks.push(...this.slidingWindowChunk(sectionText));
          } else {
            chunks.push(sectionText);
          }
        }
      }
    }

    // If no headings or only one giant heading block, fall back to sliding window.
    if (chunks.length === 0) {
      chunks.push(...this.slidingWindowChunk(text));
    }

    return chunks;
  }

  /**
   * Splits text into chunks of sizes up to `maxWords` featuring `overlapWords`.
   * Splits cleanly on periods to avoid breaking sentences.
   */
  private slidingWindowChunk(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]; // split by sentence boundary

    let currentChunk = "";
    let currentWords = 0;

    for (const sentence of sentences) {
      const sentenceWords = this.getWordCount(sentence);

      if (currentWords + sentenceWords > this.maxWords && currentWords > 0) {
        // Push current chunk, start a new one with overlap
        chunks.push(currentChunk.trim());

        // Compute overlap by taking the last N sentences of currentChunk
        currentChunk = this.getOverlapText(currentChunk) + sentence;
        currentWords = this.getWordCount(currentChunk);
      } else {
        currentChunk += sentence;
        currentWords += sentenceWords;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private getWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private getOverlapText(chunk: string): string {
    const sentences = chunk.match(/[^.!?]+[.!?]*/g) || [chunk];
    let overlap = "";
    let words = 0;

    // Work backward from the end of the chunk
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      const count = this.getWordCount(sentence);

      if (words + count <= this.overlapWords) {
        overlap = sentence + overlap;
        words += count;
      } else {
        break; // Reached the overlap limit
      }
    }

    return overlap;
  }
}
