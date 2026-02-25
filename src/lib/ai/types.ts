import { z } from "zod";

// --- 1. ATOMIC EXTRACTION SCHEMAS ---

export const RequirementSchema = z.object({
  id: z.string().describe("Unique requirement identifier (e.g., REQ-1)"),
  type: z
    .enum(["functional", "non-functional"])
    .describe("The type of requirement"),
  description: z.string().describe("Clear, atomic description of the behavior"),
  priority: z
    .enum(["High", "Medium", "Low"])
    .describe("Priority of the requirement"),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const HLDComponentSchema = z.object({
  componentId: z
    .string()
    .describe("Unique component identifier (e.g., COMP-1)"),
  description: z
    .string()
    .describe("Detailed description of the implementation"),
  sectionName: z.string().describe("The relevant section or module in the HLD"),
});

export type HLDComponent = z.infer<typeof HLDComponentSchema>;

// --- 2. EMBEDDING STORE SCHEMAS ---

export interface EmbeddedItem<T> {
  item: T;
  vector: number[];
}

export interface MatchedRequirement {
  requirement: Requirement;
  bestMatchComponent?: HLDComponent;
  similarityScore: number;
}

// --- 3. TEST CASE SCHEMAS ---

export const TestCaseSchema = z.object({
  testCaseId: z
    .string()
    .describe("Unique identifier for the test case (e.g., TC_001)"),
  mappedRequirementId: z.string().describe("The REQ ID this test case covers"),
  title: z.string().describe("Brief, descriptive title of the test case"),
  preconditions: z
    .string()
    .describe("Prerequisites before executing the test case"),
  steps: z
    .string()
    .describe("Step-by-step instructions to execute the test case"),
  expectedResult: z.string().describe("The expected outcome of the test case"),
  type: z
    .enum(["Positive", "Negative", "Edge"])
    .describe("The category or type of the test case"),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

// --- 4. COVERAGE SCHEMAS ---

export interface CoverageBreakdown {
  strongCovered: number;
  moderateCovered: number;
  partiallyCovered: number;
  notCovered: number;
  totalRequirements: number;
}

// --- 5. RESPONSE SCHEMAS ---

export interface ApprovedGenerationResult {
  status: "approved";
  coveragePercentage: number;
  coverageBreakdown: CoverageBreakdown;
  requirementMapping: MatchedRequirement[];
  testCases: TestCase[];
  download_url?: string;
}

export interface RejectedGenerationResult {
  status: "rejected";
  coveragePercentage: number;
  coverageBreakdown: CoverageBreakdown;
  missingRequirements: Requirement[];
  weakCoverageRequirements: Requirement[];
  recommendations: string[];
}

export type TestCaseGenerationResult =
  | ApprovedGenerationResult
  | RejectedGenerationResult;

// --- 6. AI PROVIDER INTERFACE ---

export interface AIProvider {
  /**
   * Generates test cases by validating an HLD against a UD document using embeddings.
   */
  generateTestCases(
    udText: string,
    hldText: string,
    threshold?: number, // 90 as default
  ): Promise<TestCaseGenerationResult>;
}
