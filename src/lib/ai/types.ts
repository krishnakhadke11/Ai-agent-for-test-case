import { z } from "zod";

/**
 * Defines the core structure of a single test case.
 * This ensures all generated test cases adhere to the required format
 * for CSV/XLSX export.
 */
export const TestCaseSchema = z.object({
  id: z.string().describe("Unique identifier for the test case (e.g., TC_001)"),
  title: z.string().describe("Brief, descriptive title of the test case"),
  description: z
    .string()
    .describe("Detailed description of what the test case verifies"),
  preconditions: z
    .string()
    .describe("Prerequisites before executing the test case"),
  steps: z
    .string()
    .describe("Step-by-step instructions to execute the test case"),
  expected_result: z.string().describe("The expected outcome of the test case"),
  priority: z
    .enum(["High", "Medium", "Low"])
    .describe("Priority level of the test case"),
  type: z
    .enum([
      "Positive",
      "Negative",
      "Boundary",
      "Edge",
      "Validation",
      "API",
      "Error Handling",
    ])
    .describe("The category or type of the test case"),
  module: z
    .string()
    .describe("The specific module or feature area being tested"),
  remarks: z.string().describe("Any additional notes or comments (optional)"),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

/**
 * Defines the summary statistics for a generated batch of test cases.
 */
export const TestCasesSummarySchema = z.object({
  total_test_cases: z.number(),
  positive: z.number(),
  negative: z.number(),
  boundary: z.number(),
  edge: z.number(),
  validation: z.number(),
});

export type TestCasesSummary = z.infer<typeof TestCasesSummarySchema>;

/**
 * Defines the complete response structure expected from the AI provider.
 */
export const TestCaseGenerationResultSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  match_percentage: z.number(),
  threshold: z.number(),
  missing_requirements: z.array(z.string()).optional(),
  recommendation: z.string().optional(),
  summary: TestCasesSummarySchema.optional(),
  test_cases: z.array(TestCaseSchema).optional(),
});

export type TestCaseGenerationResult = z.infer<
  typeof TestCaseGenerationResultSchema
>;

/**
 * Abstract interface for any AI Provider.
 * This enables the plug-and-play architecture.
 */
export interface AIProvider {
  /**
   * Generates test cases from a given document text.
   * @param udText The extracted text content from a Usage Decision document.
   * @param hldText The extracted text content from a High-Level Design document.
   * @returns A promise that resolves to the structured test case generation result.
   */
  generateTestCases(
    udText: string,
    hldText: string,
  ): Promise<TestCaseGenerationResult>;
}
