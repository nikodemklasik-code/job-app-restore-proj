export function buildSoftSkillVerificationQuestions(skill: string): string[] {
  const normalized = skill.toLowerCase();

  if (normalized.includes('lead') || normalized.includes('people')) {
    return [
      'Tell me about a time you had to manage underperformance.',
      'How do you handle disagreement between senior stakeholders?',
    ];
  }

  if (normalized.includes('stakeholder')) {
    return [
      'Describe a situation where two stakeholders wanted different outcomes.',
    ];
  }

  return ['Give one concrete example that shows this skill in practice.'];
}

export function buildHardSkillVerificationQuestions(skill: string): string[] {
  const normalized = skill.toLowerCase();

  if (normalized.includes('react')) {
    return [
      'What is the difference between controlled and uncontrolled components in React?',
    ];
  }

  if (normalized.includes('sql')) {
    return [
      'How would you debug a slow query used by a team every morning?',
    ];
  }

  return ['Answer one short practical question that demonstrates this skill.'];
}
