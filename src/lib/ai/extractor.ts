import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  Requirement,
  RequirementSchema,
  HLDComponent,
  HLDComponentSchema,
} from "./types";

/**
 * Service responsible for extracting structured atomic objects (Requirements or Components)
 * from unstructured text chunks using the Gemini model.
 */
export class AIExtractor {
  /**
   * Extracts atomic Functional/Non-Functional Requirements from a UD chunk.
   */
  public async extractRequirements(chunk: string): Promise<Requirement[]> {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        output: "array",
        schema: RequirementSchema,
        prompt: `
          You are an expert Business Analyst. 
          Extract all core atomic requirements from the following text chunk.
          Split any compound sentences into singular, testable behaviors.
          Do NOT summarize or merge requirements together.
          Ensure each requirement has a unique ID (e.g., REQ-1, REQ-2).
          
          Text chunk to process:
          """
          ${chunk}
          """
        `,
      });

      return object;
    } catch (error) {
      console.error("AIExtractor: Failed to extract requirements:", error);
      return [];
    }
  }

  /**
   * Extracts HLD Components/Modules from an HLD chunk.
   */
  public async extractComponents(chunk: string): Promise<HLDComponent[]> {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        output: "array",
        schema: HLDComponentSchema,
        prompt: `
          You are an expert Systems Architect.
          Extract all technical components, modules, or distinct implementation details 
          from the following High-Level Design text chunk.
          Do NOT summarize or merge distinct components.
          Ensure each component has a unique ID (e.g., COMP-1, COMP-2).
          
          Text chunk to process:
          """
          ${chunk}
          """
        `,
      });

      return object;
    } catch (error) {
      console.error("AIExtractor: Failed to extract components:", error);
      return [];
    }
  }
}
