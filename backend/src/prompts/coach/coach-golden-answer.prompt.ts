export function buildCoachGoldenAnswerPrompt(params: {
  question: string;
  answer: string;
  targetRole: string;
  targetLevel: string;
}) {
  const { question, answer, targetRole, targetLevel } = params;

  return `
Rewrite the candidate's answer into a stronger interview version.

Rules:
- Keep the same underlying facts.
- Do not invent achievements.
- Make the answer clearer, more structured, and stronger.
- Emphasize ownership, clarity, and result where appropriate.
- Keep it realistic for the candidate's likely level.
- Adapt to target role: ${targetRole}
- Adapt to target level: ${targetLevel}

Question:
${question}

Original answer:
${answer}

Return only JSON:
{
  "goldenAnswer": "string"
}
`;
}
