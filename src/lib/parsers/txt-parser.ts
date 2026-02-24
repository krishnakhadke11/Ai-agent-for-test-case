import { DocumentParser } from "./types";

/**
 * Parses clean TXT documents into plain text.
 * Simple wrapper decoding the buffer into UTF-8.
 */
export class TxtParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<string> {
    try {
      const text = buffer.toString("utf-8");

      if (text.trim().length === 0) {
        throw new Error("The text document is empty.");
      }

      return text;
    } catch (error) {
      console.error("TxtParser failed:", error);
      throw new Error(
        "Failed to decode the text document. Ensure it is plain text encoded in UTF-8.",
      );
    }
  }
}
