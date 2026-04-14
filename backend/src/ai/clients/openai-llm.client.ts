import { LlmChatMessage, LlmClient, LlmJsonOptions } from './llm-client.interface.js';

/**
 * Replace this with your real SDK integration.
 * This scaffold intentionally throws until wired with a provider.
 */
export class OpenAiLlmClient implements LlmClient {
  // config is intentionally scaffolded — wire real OpenAI SDK here
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_config: { apiKey?: string; model: string }) {}

  async completeText(_messages: LlmChatMessage[]): Promise<string> {
    throw new Error('OpenAiLlmClient.completeText not implemented. Wire your real model provider here.');
  }

  async completeJson<T>(_messages: LlmChatMessage[], _options: LlmJsonOptions): Promise<T> {
    throw new Error('OpenAiLlmClient.completeJson not implemented. Wire your real model provider here.');
  }
}
