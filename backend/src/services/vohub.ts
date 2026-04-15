import OpenAI from 'openai';

export type AllowedAssistantSourceType =
  | 'manual_user_input'
  | 'linkedin_profile_table'
  | 'linkedin_public_post_table'
  | 'facebook_page_post_table'
  | 'instagram_business_post_table'
  | 'job_listing_table';

export type ForbiddenAssistantSourceType =
  | 'linkedin_inmail_thread'
  | 'facebook_messenger_thread'
  | 'instagram_dm_thread'
  | 'raw_private_messages';

export type AssistantMessageRole = 'system' | 'user' | 'assistant';

export interface AssistantMessage {
  role: AssistantMessageRole;
  content: string;
}

export interface GenerateCareerResponseInput {
  systemInstruction: string;
  messages: AssistantMessage[];
  sourceType: AllowedAssistantSourceType;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_MESSAGE_COUNT = 16;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_RESPONSE_TOKENS = 700;

const FORBIDDEN_SOURCE_TYPES: ReadonlySet<string> = new Set<ForbiddenAssistantSourceType>([
  'linkedin_inmail_thread',
  'facebook_messenger_thread',
  'instagram_dm_thread',
  'raw_private_messages',
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function redactEmailAddresses(value: string): string {
  return value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]');
}

function redactPhoneNumbers(value: string): string {
  return value.replace(/(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)/g, '[redacted-phone]');
}

function redactUrls(value: string): string {
  return value.replace(/https?:\/\/\S+/gi, '[redacted-url]');
}

function redactLikelyAddressFragments(value: string): string {
  return value.replace(
    /\b\d{1,5}\s+[A-ZÀ-ÿ0-9][A-ZÀ-ÿ0-9\s.'-]{2,}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd)\b/gi,
    '[redacted-address]',
  );
}

function sanitizeMessageContent(value: string): string {
  const normalized = normalizeWhitespace(value);
  const noEmail = redactEmailAddresses(normalized);
  const noPhone = redactPhoneNumbers(noEmail);
  const noUrls = redactUrls(noPhone);
  const noAddress = redactLikelyAddressFragments(noUrls);
  return clampText(noAddress, MAX_MESSAGE_LENGTH);
}

function sanitizeAssistantMessages(messages: AssistantMessage[]): AssistantMessage[] {
  return messages
    .slice(-MAX_MESSAGE_COUNT)
    .map((message) => ({
      role: message.role,
      content: sanitizeMessageContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
}

function ensureSourceTypeAllowed(sourceType: string): AllowedAssistantSourceType {
  if (FORBIDDEN_SOURCE_TYPES.has(sourceType)) {
    throw new Error(
      'Private social-platform messages are not allowed as AI input. Use normalized public/profile/job-table data only.',
    );
  }

  switch (sourceType) {
    case 'manual_user_input':
    case 'linkedin_profile_table':
    case 'linkedin_public_post_table':
    case 'facebook_page_post_table':
    case 'instagram_business_post_table':
    case 'job_listing_table':
      return sourceType;
    default:
      throw new Error(`Unsupported assistant source type: ${sourceType}`);
  }
}

function buildGuardrailInstruction(sourceType: AllowedAssistantSourceType): string {
  return [
    'You are Multivohub Career Assistant.',
    'Be concise, accurate, practical, and honest.',
    'Do not claim access to private messages, DMs, Messenger threads, InMail, or hidden platform data.',
    'If social-platform context is present, treat it only as normalized public/profile/job-table data prepared by the backend.',
    'Do not invent recruiter outreach, user history, platform actions, or unseen account data.',
    `Current source type: ${sourceType}.`,
  ].join(' ');
}

export class VohubService {
  private static client: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (this.client) return this.client;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable');
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  private static getModel(): string {
    const configured = process.env.OPENAI_MODEL;
    return configured && configured.trim().length > 0 ? configured.trim() : DEFAULT_MODEL;
  }

  static async redactSensitiveText(rawText: string): Promise<string> {
    return sanitizeMessageContent(rawText);
  }

  static async generateCareerResponse(input: GenerateCareerResponseInput): Promise<string> {
    const sourceType = ensureSourceTypeAllowed(input.sourceType);
    const client = this.getClient();

    const systemMessage: AssistantMessage = {
      role: 'system',
      content: `${buildGuardrailInstruction(sourceType)} ${normalizeWhitespace(input.systemInstruction)}`,
    };

    const sanitizedMessages = sanitizeAssistantMessages(input.messages);

    const completion = await client.chat.completions.create({
      model: this.getModel(),
      temperature: 0.4,
      max_tokens: MAX_RESPONSE_TOKENS,
      messages: [systemMessage, ...sanitizedMessages].map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const content = completion.choices[0]?.message?.content;

    if (!content || content.trim().length === 0) {
      throw new Error('OpenAI returned an empty assistant response');
    }

    return content.trim();
  }
}
