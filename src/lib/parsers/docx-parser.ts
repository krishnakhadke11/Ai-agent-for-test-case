import mammoth from "mammoth";
import { DocumentParser } from "./types";

/**
 * Parses Microsoft Word (.docx) documents into plain text.
 * Utilizes mammoth's extractRawText.
 */
export class DocxParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error("No text content found in the DOCX document.");
      }

      // We can also check result.messages for any unexpected warnings
      return result.value;
    } catch (error) {
      console.error("DocxParser failed:", error);
      throw new Error(
        "Failed to parse the DOCX document. Please ensure it is a valid Word document.",
      );
    }
  }
}
