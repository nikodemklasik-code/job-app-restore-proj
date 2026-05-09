/**
 * Action Priority Score (0–100)
 *
 * Synthesizes all scores into a single actionable recommendation.
 * Uses signal language for explanations — never judgments.
 *
 * Pure function — no side effects, deterministic output.
 */

import { ACTION_PRIORITY_WEIGHTS, ACTION_THRESHOLDS } from '../skillMatrix/constants.js';
import type { ActionPriorityInput, ActionRecommendation } from '../skillMatrix/types.js';

export interface ActionPriorityOutput {
    score: number;
    recommendation: ActionRecommendation;
    explanation: string;
    inputScores: ActionPriorityInput;
}

/**
 * Determine the recommendation based on the rule table.
 */
function determineRecommendation(input: ActionPriorityInput): ActionRecommendation {
    const { jobFit, employerTrust, employerRisk } = input;
    const { applyNow, verifyEmployer, reject } = ACTION_THRESHOLDS;

    if (
        jobFit > applyNow.jobFitMin &&
        employerTrust > applyNow.trustMin &&
        employerRisk < applyNow.riskMax
    ) {
        return 'apply_now';
    }

    if (
        jobFit > verifyEmployer.jobFitMin &&
        (employerTrust < verifyEmployer.trustMax || employerRisk > verifyEmployer.riskMin)
    ) {
        return 'verify_employer';
    }

    if (jobFit < reject.jobFitMax) {
        return 'reject';
    }

    return 'save';
}

/**
 * Generate signal-language explanation for the recommendation.
 * Never uses judgments — always observations and patterns.
 */
function generateExplanation(
    recommendation: ActionRecommendation,
    input: ActionPriorityInput,
): string {
    switch (recommendation) {
        case 'apply_now':
            return `Strong fit signals across skills (${input.jobFit}/100) and employer trust (${input.employerTrust}/100) with low risk indicators. This opportunity aligns well with your profile.`;

        case 'verify_employer':
            return `Skill fit appears promising (${input.jobFit}/100), but employer signals suggest verifying the company further before investing time. Trust signals are limited or risk indicators are elevated.`;

        case 'reject':
            return `Current skill alignment is limited (${input.jobFit}/100). Applying may still make sense if you have unlisted relevant experience, but other opportunities may be a stronger match.`;

        case 'save':
            return `Moderate fit signals (${input.jobFit}/100) with neutral employer indicators. Worth monitoring — consider revisiting after strengthening relevant skills or gathering more employer data.`;
    }
}

/**
 * Compute Action Priority Score and recommendation.
 */
export function computeActionPriority(input: ActionPriorityInput): ActionPriorityOutput {
    const { jobFit, employerTrust, employerRisk, marketValue, skillReadiness } = input;

    // Weighted synthesis
    const raw =
        jobFit * ACTION_PRIORITY_WEIGHTS.jobFit +
        employerTrust * ACTION_PRIORITY_WEIGHTS.employerTrust +
        (100 - employerRisk) * ACTION_PRIORITY_WEIGHTS.employerRiskInverse +
        marketValue * ACTION_PRIORITY_WEIGHTS.marketValue +
        skillReadiness * ACTION_PRIORITY_WEIGHTS.skillReadiness;

    const score = Math.round(Math.min(100, Math.max(0, raw)));
    const recommendation = determineRecommendation(input);
    const explanation = generateExplanation(recommendation, input);

    return { score, recommendation, explanation, inputScores: input };
}
