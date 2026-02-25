// Removed incorrect import; pdf-parse will be dynamically imported in the parse method
import { DocumentParser } from "./types";
import { createRequire } from "module";

/**
 * Parses PDF documents into extractable text strings.
 * Uses the pdf-parse library to extract raw text ignoring formatting.
 */
export class PDFParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<string> {
    try {
      // Use Node's require to load pdf-parse CommonJS module reliably.
      const pdfParse = createRequire(import.meta.url)("pdf-parse");
      console.log("pdfParse type:", typeof pdfParse);
      const data = await pdfParse(buffer);
      console.log("pdfParse result keys:", Object.keys(data));
      // The pdf-parse result has the text payload in the 'text' property.
      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text content found in the PDF document.");
      }
      return data.text;
    } catch (error) {
      console.error("PDFParser failed:", error);
      throw new Error(
        "Failed to parse the PDF document. Please ensure it is not corrupted or password-protected.",
      );
    }
  }
}
