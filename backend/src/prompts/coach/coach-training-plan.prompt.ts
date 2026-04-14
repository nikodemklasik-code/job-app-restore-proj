export function buildCoachTrainingPlanPrompt(params: {
  targetRole: string;
  targetLevel: string;
  areasToStrengthen: string[];
}) {
  const { targetRole, targetLevel, areasToStrengthen } = params;

  return `
Create a short training plan for the candidate.

Target role: ${targetRole}
Target level: ${targetLevel}

Areas to strengthen:
${areasToStrengthen.map((x) => `- ${x}`).join('\n')}

Requirements:
- Keep the plan practical.
- Focus on 3 to 5 exercises.
- Each exercise should target one skill.
- Use constructive language.
- Make the plan realistic for the candidate's level.

Return JSON:
{
  "trainingPlan": [
    {
      "title": "string",
      "goal": "string",
      "exercise": "string"
    }
  ]
}
`;
}
