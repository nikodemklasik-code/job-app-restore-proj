/**
 * OpenAI env surface — keys only; never log values.
 * @see docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */

export function getOpenAiApiKey(): string | undefined {
  const k = process.env.OPENAI_API_KEY?.trim();
  return k || undefined;
}

export function getOpenAiApiKeyOrThrow(): string {
  const k = getOpenAiApiKey();
  if (!k) {
    throw new Error(
      'Missing or empty OPENAI_API_KEY: set this variable for the backend process (e.g. backend/.env or deployment secrets). Required for assistant, interview, negotiation, and other OpenAI-backed routes.',
    );
  }
  return k;
}
