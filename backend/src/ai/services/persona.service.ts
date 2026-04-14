import { PersonaId } from '../models/interview.types.js';
import {
  SARAH_HR_PERSONA,
  JAMES_MANAGER_PERSONA,
  ALEX_TECH_LEAD_PERSONA,
} from '../../prompts/index.js';

export function getPersonaPrompt(persona: PersonaId): string {
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

export function getPersonaDisplayName(persona: PersonaId): string {
  switch (persona) {
    case 'sarah':
      return 'Sarah HR';
    case 'james':
      return 'James Manager';
    case 'alex':
      return 'Alex Tech Lead';
    default:
      return 'Sarah HR';
  }
}
