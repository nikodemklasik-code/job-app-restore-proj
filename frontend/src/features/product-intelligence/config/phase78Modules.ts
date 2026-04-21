import type { IntelligenceModuleReadiness } from '../types/intelligence.types';

export const PHASE_78_MODULES: IntelligenceModuleReadiness[] = [
  {
    id: 'assistant-routing',
    capability: 'Assistant routing',
    status: 'in_progress',
    signal: 'Action routing maps to key modules and is under consistency cleanup.',
  },
  {
    id: 'interview-summary',
    capability: 'Interview summary intelligence',
    status: 'ready',
    signal: 'Live summary and coaching-plan outputs are active in interview flows.',
  },
  {
    id: 'negotiation-simulator',
    capability: 'Negotiation simulator intelligence',
    status: 'ready',
    signal: 'Simulation and strategy streams are available with scenario presets.',
  },
];

