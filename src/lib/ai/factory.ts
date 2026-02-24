import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini-provider";

/**
 * Factory class to instantiate the correct AI provider based on
 * the AI_PROVIDER environment variable.
 *
 * Supports "gemini" by default. Can be extended to "claude" or others
 * without touching the core business logic.
 */
export class AIFactory {
  /**
   * Returns the appropriate AI Provider instance.
   * Throws an error if an unsupported provider is requested.
   */
  static getProvider(): AIProvider {
    const providerKey = process.env.AI_PROVIDER?.toLowerCase() || "gemini";

    switch (providerKey) {
      case "gemini":
        return new GeminiProvider();
      // case "claude":
      //   return new ClaudeProvider();
      default:
        console.warn(
          `AI_PROVIDER '${providerKey}' is not supported. Falling back to Gemini.`,
        );
        return new GeminiProvider();
    }
  }
}
