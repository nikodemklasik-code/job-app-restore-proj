import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getOpenAiClient } from '../../lib/openai/openai.client.js';
import { getPremiumTextModel } from '../../lib/openai/model-registry.js';
import type { LlmChatMessage, LlmClient, LlmJsonOptions } from './llm-client.interface.js';

function toChatMessages(messages: LlmChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Shared OpenAI chat client for orchestrators (reports, coach handoff, etc.).
 * Uses the centralized SDK client — do not pass real apiKey from callers; env only.
 */
export class OpenAiLlmClient implements LlmClient {
  private readonly model: string;

  constructor(config: { apiKey?: string; model?: string } = {}) {
    void config.apiKey;
    this.model = (config.model && config.model.trim()) || getPremiumTextModel();
  }

  async completeText(messages: LlmChatMessage[]): Promise<string> {
    const client = getOpenAiClient();
    const completion = await client.chat.completions.create({
      model: this.model,
      messages: toChatMessages(messages),
      temperature: 0.5,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenAI returned an empty text completion');
    }
    return text;
  }

  async completeJson<T>(messages: LlmChatMessage[], _options: LlmJsonOptions): Promise<T> {
    const client = getOpenAiClient();
    const completion = await client.chat.completions.create({
      model: this.model,
      messages: toChatMessages(messages),
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error('OpenAI returned an empty JSON completion');
    }
    return JSON.parse(raw) as T;
  }
}
