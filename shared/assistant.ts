export const assistantModes = ['general', 'cv', 'interview', 'salary'] as const;
export type AssistantMode = (typeof assistantModes)[number];

export const allowedAssistantSourceTypes = [
  'manual_user_input',
  'linkedin_profile_table',
  'linkedin_public_post_table',
  'facebook_page_post_table',
  'instagram_business_post_table',
  'job_listing_table',
] as const;

export type AllowedAssistantSourceType = (typeof allowedAssistantSourceTypes)[number];

export const forbiddenAssistantSourceTypes = [
  'linkedin_inmail_thread',
  'facebook_messenger_thread',
  'instagram_dm_thread',
  'raw_private_messages',
] as const;

export type ForbiddenAssistantSourceType = (typeof forbiddenAssistantSourceTypes)[number];

export type AssistantMessageRole = 'user' | 'assistant' | 'system';

export interface AssistantHistoryMessage {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  text: string;
  sourceType: AllowedAssistantSourceType;
  createdAt: string;
}

export interface AssistantSendResponse {
  conversationId: string;
  userRecord: AssistantHistoryMessage;
  aiRecord: AssistantHistoryMessage;
}
