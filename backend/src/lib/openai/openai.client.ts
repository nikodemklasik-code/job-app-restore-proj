import OpenAI from 'openai';
import { getOpenAiApiKey, getOpenAiApiKeyOrThrow } from '../../config/ai.env.js';

let singleton: OpenAI | null = null;

/** Single shared OpenAI client for the backend process. */
export function getOpenAiClient(): OpenAI {
  if (!singleton) {
    singleton = new OpenAI({ apiKey: getOpenAiApiKeyOrThrow() });
  }
  return singleton;
}

/** Recreate client (e.g. tests). */
export function resetOpenAiClientForTests(): void {
  singleton = null;
}

export function tryGetOpenAiClient(): OpenAI | null {
  const key = getOpenAiApiKey();
  if (!key) return null;
  if (!singleton) {
    singleton = new OpenAI({ apiKey: key });
  }
  return singleton;
}
