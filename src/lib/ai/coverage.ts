import { CoverageBreakdown, MatchedRequirement, Requirement } from "./types";

/**
 * Service to mathematically evaluate coverage thresholds from the MatchedRequirement list.
 */
export class AICoverageEngine {
  /**
   * Evaluates the full array of matches, calculates percentage,
   * and splits them out into missing vs covered.
   */
  public evaluateCoverage(matches: MatchedRequirement[]): {
    coveragePercentage: number;
    breakdown: CoverageBreakdown;
    missingRequirements: Requirement[]; // Score < 0.70
    weakCoverageRequirements: Requirement[]; // Score >= 0.70 && < 0.82
    coveredRequirements: MatchedRequirement[]; // Score >= 0.82
  } {
    let strongCovered = 0;
    let moderateCovered = 0;
    let partiallyCovered = 0;
    let notCovered = 0;

    const missingRequirements: Requirement[] = [];
    const weakCoverageRequirements: Requirement[] = [];
    const coveredRequirements: MatchedRequirement[] = [];

    for (const match of matches) {
      const score = match.similarityScore;

      if (score >= 0.9) {
        strongCovered++;
        coveredRequirements.push(match);
      } else if (score >= 0.82) {
        moderateCovered++;
        coveredRequirements.push(match);
      } else if (score >= 0.7) {
        partiallyCovered++;
        weakCoverageRequirements.push(match.requirement);
      } else {
        notCovered++;
        missingRequirements.push(match.requirement);
      }
    }

    const totalRequirements = matches.length;

    const coveragePercentage =
      totalRequirements === 0
        ? 0
        : Math.round(
            ((strongCovered + moderateCovered) / totalRequirements) * 100,
          );

    return {
      coveragePercentage,
      breakdown: {
        strongCovered,
        moderateCovered,
        partiallyCovered,
        notCovered,
        totalRequirements,
      },
      missingRequirements,
      weakCoverageRequirements,
      coveredRequirements,
    };
  }
}
