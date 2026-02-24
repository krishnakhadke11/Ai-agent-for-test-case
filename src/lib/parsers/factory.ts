import { DocumentParser } from "./types";
import { PDFParser } from "./pdf-parser";
import { DocxParser } from "./docx-parser";
import { TxtParser } from "./txt-parser";

/**
 * Factory for routing a given file type (MIME or extension)
 * to the appropriate parsing implementation.
 */
export class ParserFactory {
  /**
   * Identifies the required parser from the filename's extension
   * or file MIME type, then returns the corresponding parser instance.
   *
   * @param fileName Name of the uploaded file
   * @param mimeType MIME type of the uploaded file
   */
  static getParser(fileName: string, mimeType: string): DocumentParser {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    if (mimeType === "application/pdf" || ext === "pdf") {
      return new PDFParser();
    }

    // Support modern Word docs
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx" ||
      ext === "doc"
    ) {
      return new DocxParser();
    }

    if (mimeType.startsWith("text/plain") || ext === "txt") {
      return new TxtParser();
    }

    throw new Error(
      `Unsupported document type. Received extension '${ext}' and mime type '${mimeType}'.`,
    );
  }
}
