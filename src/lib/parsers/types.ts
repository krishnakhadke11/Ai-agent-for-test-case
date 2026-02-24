/**
 * Interface defining the shared behavior of all document parsers.
 * The parse method extracts plain text from a given file buffer.
 */
export interface DocumentParser {
  /**
   * Extracts text content from a file buffer.
   * @param buffer The incoming file as a Node.js Buffer.
   * @returns A promise resolving to the extracted plain text string.
   */
  parse(buffer: Buffer): Promise<string>;
}
