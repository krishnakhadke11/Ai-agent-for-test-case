import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  AIProvider,
  TestCaseGenerationResult,
  TestCaseSchema,
  Requirement,
  HLDComponent,
} from "./types";
import { TextChunker } from "./chunker";
import { AIExtractor } from "./extractor";
import { AIEmbedder } from "./embedder";
import { AIMatcher } from "./matcher";
import { AICoverageEngine } from "./coverage";

export class GeminiProvider implements AIProvider {
  private chunker = new TextChunker(1000, 150);
  private extractor = new AIExtractor();
  private embedder = new AIEmbedder();
  private matcher = new AIMatcher();
  private coverageEngine = new AICoverageEngine();

  public async generateTestCases(
    udText: string,
    hldText: string,
    threshold: number = 90,
  ): Promise<TestCaseGenerationResult> {
    console.log("--- 1. Chunking Documents ---");
    const udChunks = this.chunker.chunkText(udText);
    const hldChunks = this.chunker.chunkText(hldText);

    console.log(
      `Chunks generated: UD=${udChunks.length}, HLD=${hldChunks.length}`,
    );

    console.log("--- 2. Extracting Items ---");
    const rawRequirements: Requirement[] = [];
    const rawComponents: HLDComponent[] = [];

    // Process all chunks in parallel for speed
    const reqPromises = udChunks.map((chunk) =>
      this.extractor.extractRequirements(chunk),
    );
    const compPromises = hldChunks.map((chunk) =>
      this.extractor.extractComponents(chunk),
    );

    const reqResults = await Promise.all(reqPromises);
    const compResults = await Promise.all(compPromises);

    reqResults.forEach((arr) => rawRequirements.push(...arr));
    compResults.forEach((arr) => rawComponents.push(...arr));

    console.log(
      `Raw extracted Items: Requirements=${rawRequirements.length}, Components=${rawComponents.length}`,
    );

    if (rawRequirements.length === 0) {
      throw new Error(
        "Failed to extract any functional requirements from the UD document.",
      );
    }

    console.log("--- 3. Generating Embeddings ---");
    const reqDescriptions = rawRequirements.map(
      (r) => r.description + " " + r.type,
    );
    const compDescriptions = rawComponents.map(
      (c) => c.sectionName + " " + c.description,
    );

    const [reqVectors, compVectors] = await Promise.all([
      this.embedder.generateEmbeddings(reqDescriptions),
      this.embedder.generateEmbeddings(compDescriptions),
    ]);

    console.log("--- 4. Deduplicating and Matching Engine ---");
    const dedupReqs = this.matcher.deduplicateRequirements(
      rawRequirements,
      reqVectors,
    );
    const dedupComps = this.matcher.deduplicateComponents(
      rawComponents,
      compVectors,
    );

    console.log(
      `Deduplicated Items: Requirements=${dedupReqs.length}, Components=${dedupComps.length}`,
    );

    const matches = this.matcher.matchRequirementsToComponents(
      dedupReqs,
      dedupComps,
    );

    // DEBUG: Log the matches and scores
    matches.forEach((m) => {
      console.log(
        `[REQ] ${m.requirement.id} - ${m.requirement.description.substring(0, 30)}...`,
      );
      console.log(
        `[HLD] ${m.bestMatchComponent?.componentId} - ${m.bestMatchComponent?.description.substring(0, 30)}...`,
      );
      console.log(`[CosSim] Score: ${m.similarityScore}`);
    });

    console.log("--- 5. Evaluating Coverage Rule ---");
    const evaluation = this.coverageEngine.evaluateCoverage(matches);

    console.log(
      `Final Coverage: ${evaluation.coveragePercentage}% (Threshold: ${threshold}%)`,
    );

    if (evaluation.coveragePercentage < threshold) {
      // Deterministically reject if coverage mathematics fail
      return {
        status: "rejected",
        coveragePercentage: evaluation.coveragePercentage,
        coverageBreakdown: evaluation.breakdown,
        missingRequirements: evaluation.missingRequirements,
        weakCoverageRequirements: evaluation.weakCoverageRequirements,
        recommendations: [
          "Ensure your HLD explicitly implements all UD functional requirements.",
          "Check for missing system integration edges.",
        ],
      };
    }

    console.log("--- 6. Generating Test Cases for Covered Requirements ---");

    // Only test what is actually covered strongly or moderately
    const coveredReqsData = evaluation.coveredRequirements.map((m) => ({
      reqId: m.requirement.id,
      reqDesc: m.requirement.description,
      hldComp: m.bestMatchComponent?.componentId,
      hldDesc: m.bestMatchComponent?.description,
    }));

    try {
      const { object: testCases } = await generateObject({
        model: google("gemini-2.5-flash"),
        output: "array",
        schema: TestCaseSchema,
        prompt: `
          You are an expert QA Engineer.
          Generate professional test cases for the following COVERED requirements.
          For every requirement provided, generate at least 1 Positive test case and 1 Negative test case.
          Map each test case accurately back to its 'mappedRequirementId' (use the 'reqId' provided).
          
          Covered Requirements to verify:
          ${JSON.stringify(coveredReqsData, null, 2)}
          
          Strict JSON Format Requirements:
          - Only return valid JSON mapping properties described in the schema.
        `,
      });

      return {
        status: "approved",
        coveragePercentage: evaluation.coveragePercentage,
        coverageBreakdown: evaluation.breakdown,
        requirementMapping: matches, // Return the full matrix mapping for transparency
        testCases: testCases,
      };
    } catch (error) {
      console.error("============= TEST CASE GENERATION FAILURE =========");
      console.error(error);
      throw new Error("Failed to generate test cases using Gemini Provider.");
    }
  }
}
