export function buildCoachAnalysisPrompt(params: {
  question: string;
  answer: string;
}) {
  const { question, answer } = params;

  return `
Analyze the following interview answer.

Question:
${question}

Answer:
${answer}

Provide:
1. Direct quote(s) from the answer
2. Answer strength score from 0 to 10
3. STAR breakdown
4. Competencies demonstrated
5. What would make the answer come through more strongly
6. What to practice next
7. Disclaimer that this analysis applies to this answer, not the whole person

Return JSON:
{
  "quotes": ["string"],
  "score": 0,
  "star": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  },
  "competencies": ["string"],
  "strengthenFocus": ["string"],
  "practiceNext": ["string"],
  "disclaimer": "string"
}
`;
}
