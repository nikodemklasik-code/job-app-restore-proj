/**
 * trainer-routing.ts
 *
 * Maps session signal keys to Coach training modules.
 * Source of truth: docs/ai/trainer-routing.md
 *
 * Used in:
 * - closingSummary generation → nextInterviewFocus
 * - PDF page 6 (Next Steps / Recommended modules)
 * - Handoff object from Interview → Coach
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalKey =
  | 'ownership'
  | 'structure'
  | 'results'
  | 'conciseness'
  | 'delivery'
  | 'problem_solving'
  | 'depth'
  | 'stakeholder_comm'
  | 'business_thinking'
  | 'calm_delivery'
  | 'technical_depth';

export type CoachModule =
  | 'behavioral_star'
  | 'tell_me_about_yourself'
  | 'ownership_language'
  | 'impact_results'
  | 'concise_answering'
  | 'delivery_fillers'
  | 'technical_depth'
  | 'case_study'
  | 'leadership_answers'
  | 'stakeholder_communication'
  | 'difficult_questions'
  | 'motivation_why_role'
  | 'salary_expectations'
  | 'closing_questions';

export interface TrainerRoute {
  signalKey: SignalKey;
  /** Condition that triggers this route (improvement needed) */
  triggerCondition: string;
  /** Primary Coach module to recommend */
  primaryModule: CoachModule;
  /** Optional secondary module */
  secondaryModule?: CoachModule;
  /** Human-readable recommendation for the PDF / closing summary */
  recommendation: string;
  /** Concrete practice task */
  practiceTask: string;
}

export interface CoachModuleInfo {
  key: CoachModule;
  label: string;
  description: string;
}

// ─── Coach module definitions ─────────────────────────────────────────────────

export const COACH_MODULES: Record<CoachModule, CoachModuleInfo> = {
  behavioral_star: {
    key: 'behavioral_star',
    label: 'Behavioral / STAR',
    description: 'Practise structuring answers using Situation → Task → Action → Result.',
  },
  tell_me_about_yourself: {
    key: 'tell_me_about_yourself',
    label: 'Tell Me About Yourself',
    description: 'Build a compelling, structured 2-minute professional introduction.',
  },
  ownership_language: {
    key: 'ownership_language',
    label: 'Ownership Language',
    description: 'Replace "we did" with "I decided" — express personal contribution clearly.',
  },
  impact_results: {
    key: 'impact_results',
    label: 'Impact & Results',
    description: 'Add measurable outcomes to every answer. Quantify wherever possible.',
  },
  concise_answering: {
    key: 'concise_answering',
    label: 'Concise Answering',
    description: 'The 90-second rule — shorten openings, reach the point faster.',
  },
  delivery_fillers: {
    key: 'delivery_fillers',
    label: 'Delivery — Filler Reduction',
    description: 'Replace "um", "uh", "kind of" with deliberate pauses.',
  },
  technical_depth: {
    key: 'technical_depth',
    label: 'Technical Depth',
    description: 'Articulate architecture decisions, trade-offs, and reasoning clearly.',
  },
  case_study: {
    key: 'case_study',
    label: 'Case Study / Problem Solving',
    description: 'Structure business problems: diagnose → framework → recommendation.',
  },
  leadership_answers: {
    key: 'leadership_answers',
    label: 'Leadership Answers',
    description: 'Articulate team leadership, delegation, conflict, and people development.',
  },
  stakeholder_communication: {
    key: 'stakeholder_communication',
    label: 'Stakeholder Communication',
    description: 'Show how you manage relationships, influence without authority, align teams.',
  },
  difficult_questions: {
    key: 'difficult_questions',
    label: 'Difficult Questions / Pressure',
    description: 'Handle failure, conflict, and gap questions with composure and structure.',
  },
  motivation_why_role: {
    key: 'motivation_why_role',
    label: 'Motivation & Why This Role',
    description: 'Build a clear, authentic narrative around career direction and role fit.',
  },
  salary_expectations: {
    key: 'salary_expectations',
    label: 'Salary Expectations',
    description: 'Navigate compensation conversations confidently and strategically.',
  },
  closing_questions: {
    key: 'closing_questions',
    label: 'Closing Questions for Interviewer',
    description: 'Prepare 3-5 sharp questions that signal engagement and seniority.',
  },
};

// ─── Signal → Module routing table ───────────────────────────────────────────

export const TRAINER_ROUTES: TrainerRoute[] = [
  {
    signalKey: 'structure',
    triggerCondition: 'avg STAR coverage < 0.5 across session',
    primaryModule: 'behavioral_star',
    recommendation: 'Structure every answer with Situation → Task → Action → Result.',
    practiceTask: 'Record yourself answering 3 behavioral questions this week. Check each answer for all 4 STAR elements before submitting.',
  },
  {
    signalKey: 'ownership',
    triggerCondition: 'ownershipScore < 50 — too much "we", not enough "I"',
    primaryModule: 'ownership_language',
    recommendation: 'Show your personal contribution more explicitly in every answer.',
    practiceTask: 'After each answer, find one "we" and replace it with a specific "I" statement. Name exactly what you decided or did.',
  },
  {
    signalKey: 'results',
    triggerCondition: 'quantifiedTurns ≤ 1 across session',
    primaryModule: 'impact_results',
    recommendation: 'Add at least one measurable outcome to every answer.',
    practiceTask: 'For every achievement you describe, ask: "By how much? How many people? Over what timeframe?" Add that number.',
  },
  {
    signalKey: 'conciseness',
    triggerCondition: 'avgAnswerWords > 200 or shortAnswers ≥ 3',
    primaryModule: 'concise_answering',
    recommendation: 'Shorten your opening and reach the concrete example faster.',
    practiceTask: 'Time your next 5 practice answers. Aim for 60–90 seconds. Cut anything before the specific example.',
  },
  {
    signalKey: 'delivery',
    triggerCondition: 'fillerCount ≥ 15 across session',
    primaryModule: 'delivery_fillers',
    recommendation: 'Replace filler words with deliberate pauses — it sounds more confident.',
    practiceTask: 'Record one answer and count your fillers. In the next take, replace each "um" with 1 second of silence.',
  },
  {
    signalKey: 'depth',
    triggerCondition: 'avgScore < 55',
    primaryModule: 'behavioral_star',
    secondaryModule: 'technical_depth',
    recommendation: 'Increase depth and specificity across your answers.',
    practiceTask: 'After each answer, ask yourself: "What decision did I make? What was the exact outcome?" Add both to every answer.',
  },
  {
    signalKey: 'problem_solving',
    triggerCondition: 'action STAR coverage < 0.5 — actions not clearly described',
    primaryModule: 'behavioral_star',
    secondaryModule: 'case_study',
    recommendation: 'Be more explicit about the specific steps you took and why.',
    practiceTask: 'In every answer, include one "I decided to X because Y" sentence. Make your reasoning visible.',
  },
  {
    signalKey: 'stakeholder_comm',
    triggerCondition: 'no stakeholder dimension present in senior/lead session',
    primaryModule: 'stakeholder_communication',
    recommendation: 'Show how you work with and influence people across teams.',
    practiceTask: 'In your next 3 answers, include one sentence about a stakeholder: who they were, what they needed, how you aligned.',
  },
  {
    signalKey: 'technical_depth',
    triggerCondition: 'technical role but shallow reasoning detected',
    primaryModule: 'technical_depth',
    recommendation: 'Articulate your technical decisions and the reasoning behind them more clearly.',
    practiceTask: 'For every technical decision you mention, add: what alternatives you considered and why you chose this approach.',
  },
  {
    signalKey: 'business_thinking',
    triggerCondition: 'senior/lead role but no business impact mentioned',
    primaryModule: 'leadership_answers',
    recommendation: 'Connect your actions to business outcomes — show the broader impact.',
    practiceTask: 'In every answer about a project, add one sentence about the business result: revenue, time saved, users impacted, or risk reduced.',
  },
];

// ─── Handoff object: Interview → Coach ───────────────────────────────────────

export interface SessionHandoff {
  /** Signals where improvement was detected */
  improvementSignals: SignalKey[];
  /** Signals where strength was detected */
  strengthSignals: SignalKey[];
  /** Ordered list of recommended Coach modules (highest priority first) */
  recommendedModules: CoachModule[];
  /** Top 3 practice tasks for the user */
  practiceTasks: string[];
  /** Sections of the interview where quality dropped most */
  weakestSections: string[];
  /** Difficulty recommendation for the next session */
  nextSessionDifficulty: 'standard' | 'stretch' | 'senior';
}

// ─── Routing helper ───────────────────────────────────────────────────────────

export function buildSessionHandoff(
  improvementSignals: SignalKey[],
  strengthSignals: SignalKey[],
  currentDifficulty: 'standard' | 'stretch' | 'senior',
  averageScore: number,
): SessionHandoff {
  // Find matching routes for improvement signals
  const matchedRoutes = TRAINER_ROUTES.filter((r) =>
    improvementSignals.includes(r.signalKey),
  );

  // Deduplicate modules (preserve priority order)
  const seen = new Set<CoachModule>();
  const recommendedModules: CoachModule[] = [];
  for (const route of matchedRoutes) {
    if (!seen.has(route.primaryModule)) {
      seen.add(route.primaryModule);
      recommendedModules.push(route.primaryModule);
    }
    if (route.secondaryModule && !seen.has(route.secondaryModule)) {
      seen.add(route.secondaryModule);
      recommendedModules.push(route.secondaryModule);
    }
  }

  const practiceTasks = matchedRoutes
    .slice(0, 3)
    .map((r) => r.practiceTask);

  // Recommend difficulty step-up if average score is high
  const nextSessionDifficulty: SessionHandoff['nextSessionDifficulty'] =
    averageScore >= 80 && currentDifficulty === 'standard' ? 'stretch' :
    averageScore >= 80 && currentDifficulty === 'stretch' ? 'senior' :
    currentDifficulty;

  return {
    improvementSignals,
    strengthSignals,
    recommendedModules: recommendedModules.slice(0, 4),
    practiceTasks,
    weakestSections: improvementSignals.map((s) => s.replace(/_/g, ' ')),
    nextSessionDifficulty,
  };
}
