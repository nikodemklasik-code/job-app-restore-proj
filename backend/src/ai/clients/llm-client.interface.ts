export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmJsonOptions<TSchemaName extends string = string> {
  schemaName: TSchemaName;
  schemaDescription?: string;
}

export interface LlmClient {
  completeText(messages: LlmChatMessage[]): Promise<string>;
  completeJson<T>(messages: LlmChatMessage[], options: LlmJsonOptions): Promise<T>;
}
