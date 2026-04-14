export interface ModuleRecommendation {
  suggestedModule: 'assistant' | 'warmup' | 'interview' | 'coach' | 'negotiation';
  reason: string;
  ctaLabel: string;
}
