/**
 * Text generation helper — "Responses-style" surface implemented with chat.completions
 * until the installed `openai` SDK exposes a stable `responses` API for our version.
 * @see docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */

import type OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ResponsesStyleTextParams {
  model: string;
  /** Single user turn or concatenated input */
  input: string;
  instructions?: string;
  tools?: ChatCompletionTool[];
  maxTokens?: number;
  temperature?: number;
}

export async function createResponsesStyleText(
  client: OpenAI,
  params: ResponsesStyleTextParams,
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [];
  if (params.instructions?.trim()) {
    messages.push({ role: 'system', content: params.instructions.trim() });
  }
  messages.push({ role: 'user', content: params.input });

  const completion = await client.chat.completions.create({
    model: params.model,
    messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.7,
    tools: params.tools?.length ? params.tools : undefined,
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

export async function createChatTextCompletion(
  client: OpenAI,
  params: {
    model: string;
    messages: ChatCompletionMessageParam[];
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: params.model,
    messages: params.messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}
