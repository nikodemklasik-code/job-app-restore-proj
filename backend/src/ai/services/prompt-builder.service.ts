import {
  buildInterviewSystemPrompt,
  buildCoachSystemPrompt,
  SARAH_HR_PERSONA,
  JAMES_MANAGER_PERSONA,
  ALEX_TECH_LEAD_PERSONA,
} from '../../prompts/index.js';

export function getPersonaPrompt(persona: 'sarah' | 'james' | 'alex') {
  switch (persona) {
    case 'sarah':
      return SARAH_HR_PERSONA;
    case 'james':
      return JAMES_MANAGER_PERSONA;
    case 'alex':
      return ALEX_TECH_LEAD_PERSONA;
    default:
      return SARAH_HR_PERSONA;
  }
}

export function buildInterviewPromptBundle(params: {
  targetRole: string;
  targetLevel: string;
  persona: 'sarah' | 'james' | 'alex';
}) {
  const personaPrompt = getPersonaPrompt(params.persona);

  return buildInterviewSystemPrompt({
    targetRole: params.targetRole,
    targetLevel: params.targetLevel,
    personaPrompt,
  });
}

export function buildCoachPromptBundle(params: {
  targetRole: string;
  targetLevel: string;
}) {
  return buildCoachSystemPrompt({
    targetRole: params.targetRole,
    targetLevel: params.targetLevel,
  });
}
