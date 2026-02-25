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
   * Constructs the specific prompt for test case generation based on UD and HLD.
   * @param udText The raw text from the UD.
   * @param hldText The raw text from the HLD.
   * @returns The constructed prompt string.
   */
  // private buildPrompt(udText: string, hldText: string): string {
  //   return `
  //     You are an expert Quality Assurance Engineer and Test Automation Specialist.
  //     I will provide you with two documents:
  //     1. Usage Decision (UD): Describes the functional requirements and logical working.
  //     2. High-Level Design (HLD): Describes the technical design and implementation mappings.

  //     Your objective is to:
  //     1. Extract all functional requirements from the UD.
  //     2. Extract all design mappings / implementations from the HLD.
  //     3. Perform requirement-to-design mapping.
  //     4. Calculate match percentage based on coverage of functional flows, validation rules, error handling, etc.

  //     THRESHOLD RULE:
  //     - If Match % >= 90%:
  //       - Generate complete test coverage (Positive, Negative, Boundary, Edge, Validation, API, Error Handling, Data Consistency).
  //       - Ensure no duplicate test cases and full logical coverage.
  //       - Return status: "approved".
  //     - If Match % < 90%:
  //       - DO NOT generate test cases.
  //       - Return status: "rejected".
  //       - List missing requirements and a recommendation to update the HLD.

  //     STRICT OUTPUT RULES:
  //     - Return ONLY valid JSON.
  //     - No markdown, no explanations.
  //     - Never hallucinate requirements.

  //     ---
  //     USAGE DECISION (UD) TEXT:
  //     ${udText}

  //     ---
  //     HIGH-LEVEL DESIGN (HLD) TEXT:
  //     ${hldText}
  //     ---
  //   `;
  // }

  private buildPrompt(udText: string, hldText: string): string {
    return `
        You are a senior QA Architect specializing in Requirement Traceability.

        You will receive:
        1. Usage Decision (UD)
        2. High-Level Design (HLD)

        Follow these steps STRICTLY:

        ========================
        STEP 1 — Extract Requirements from UD
        ========================
        - Extract ALL functional requirements.
        - Convert them into atomic, testable statements.
        - Each requirement must represent ONE logical condition only.
        - Count total number of requirements.

        ========================
        STEP 2 — Extract Implementations from HLD
        ========================
        - Extract atomic implementation statements.
        - Each statement must represent one implemented behavior.

        ========================
        STEP 3 — Requirement Mapping
        ========================
        For each UD requirement:
        - Determine if it is covered by at least one HLD implementation.
        - Mark as covered or not covered.

        ========================
        STEP 4 — Match Percentage Calculation
        ========================

        Use STRICT formula:

        match_percentage = 
        (covered_requirements / total_requirements) * 100

        Round to nearest integer.

        Threshold = 90

        ========================
        DECISION LOGIC
        ========================

        IF match_percentage < 90:
        - Status = "rejected"
        - Do NOT generate test cases.
        - Provide list of missing requirements.

        IF match_percentage >= 90:
        - Status = "approved"
        - Generate complete test coverage:
          Positive
          Negative
          Boundary
          Edge
          Validation
          API
          Error Handling
          Data Consistency
        - Ensure no duplicate test cases.
        - Ensure every requirement is covered by at least one test case.

        ========================
        STRICT RULES
        ========================
        - Do NOT hallucinate requirements.
        - Do NOT assume implementations not present.
        - Follow formula exactly.
        - Base match only on requirement coverage (not subjective scoring).

        ========================

        UD:
        ${udText}

        ========================

        HLD:
        ${hldText}
      `;
  }

  /**
   * Communicates with Google's Gemini via the Vercel AI SDK
   * to strictly return the JSON structure defined by TestCaseGenerationResultSchema.
   */
  async generateTestCases(
    udText: string,
    hldText: string,
  ): Promise<TestCaseGenerationResult> {
    try {
      const prompt = this.buildPrompt(udText, hldText);

      const { object } = await generateObject({
        model: google("gemini-2.0-flash"),
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
