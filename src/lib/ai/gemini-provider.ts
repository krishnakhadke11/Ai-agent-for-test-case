import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  AIProvider,
  TestCaseGenerationResult,
  TestCaseGenerationResultSchema,
} from "./types";

/**
 * Gemini implementation of the AIProvider.
 * Uses the Vercel AI SDK to stream/parse structured JSON for test case generation.
 */
export class GeminiProvider implements AIProvider {
  /**
   * Constructs the specific prompt for test case generation based on the Usage Decision document.
   * @param documentText The raw text from the uploaded document.
   * @returns The constructed prompt string.
   */
  private buildPrompt(documentText: string): string {
    return `
      You are an expert Quality Assurance Engineer and Test Automation Specialist.
      I will provide you with a Usage Decision (UD) document describing the full logical working of an application.

      Your objective is to:
      1. Parse and extract meaningful functional requirements from this text.
      2. Analyze workflows, conditions, validations, edge cases, and failure paths.
      3. Generate all possible test cases covering:
         - Positive test cases
         - Negative test cases
         - Boundary test cases
         - Edge cases
         - Validation scenarios
         - Error handling cases

      Return strictly a structured JSON object according to the exact schema provided.
      Do not include explanations, intro text, or formatting beyond the requested JSON.

      Here is the Usage Decision document content:
      ---
      ${documentText}
      ---
    `;
  }

  /**
   * Communicates with Google's Gemini via the Vercel AI SDK
   * to strictly return the JSON structure defined by TestCaseGenerationResultSchema.
   */
  async generateTestCases(
    documentText: string,
  ): Promise<TestCaseGenerationResult> {
    try {
      const prompt = this.buildPrompt(documentText);

      // Using gemini-1.5-pro for better context windows and reasoning capabilities.
      // Falls back to standard gemini if preferred.
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: TestCaseGenerationResultSchema,
        prompt: prompt,
        temperature: 0.2, // Low temperature for deterministic output
      });

      return object;
    } catch (error) {
      console.error("GeminiProvider: Failed to generate test cases:", error);
      throw new Error("Failed to generate test cases using Gemini Provider.");
    }
  }
}
