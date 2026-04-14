import type { CoachHandoff } from '../../prompts/schemas/handoff.schema.js';
import { buildInterviewHandoffPrompt } from '../../prompts/interview/interview-handoff-to-coach.prompt.js';

export function createCoachHandoffPrompt(params: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}): string {
  return buildInterviewHandoffPrompt(params);
}

export async function generateCoachHandoff(_: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}): Promise<CoachHandoff> {
  return {
    topStrengths: [
      'Ownership language in project examples',
      'Calm communication under pressure',
      'Logical explanation of decisions',
    ],
    areasToStrengthen: [
      'Bring results forward earlier',
      'Show more measurable impact',
      'Make individual role more visible in team stories',
    ],
    weakestSections: ['behavioral', 'impact articulation'],
    communicationPatterns: [
      'Answers sometimes start too wide before reaching the main point',
      'Candidate becomes more general under pressure',
    ],
    recommendedCoachModules: [
      'STAR / behavioral',
      'measurable impact',
      'concise answering',
    ],
  };
}
