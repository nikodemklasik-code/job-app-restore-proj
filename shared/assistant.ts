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

export const assistantIntents = [
  'ask_for_advice',
  'review_answer',
  'rewrite_answer',
  'prepare_for_interview',
  'salary_negotiation',
  'improve_cv',
  'improve_profile',
  'explain_fit',
  'job_search_help',
  'followup_message',
  'skill_verification_request',
  'route_to_module',
] as const;

export type AssistantIntent = (typeof assistantIntents)[number];

export interface AssistantActionSuggestion {
  id: string;
  label: string;
  prompt: string;
  route?: string;
  mode?: AssistantMode;
  cta?: string;
  status?: 'Available' | 'Recommended' | 'Needs Context';
}

export interface AssistantRouteSuggestion {
  label: string;
  route: string;
  reason: string;
}

export interface AssistantContextRef {
  type: 'profile' | 'applications' | 'job_radar' | 'skills' | 'documents' | 'assistant';
  label: string;
  value: string;
}

export interface AssistantSafetyNote {
  level: 'info' | 'warning' | 'block';
  text: string;
}

export interface AssistantResponseMeta {
  detectedIntent: AssistantIntent;
  suggestedActions: AssistantActionSuggestion[];
  routeSuggestions: AssistantRouteSuggestion[];
  contextRefs: AssistantContextRef[];
  safetyNotes: AssistantSafetyNote[];
  nextBestStep?: string;
  complianceFlags?: string[];
}

export interface AssistantStructuredResponse {
  conversation: string;
  relevantContext: AssistantContextRef[];
  suggestedActions: AssistantActionSuggestion[];
  nextBestStep: string;
  routeSuggestions: AssistantRouteSuggestion[];
  safetyNotes: AssistantSafetyNote[];
}

export interface AssistantHistoryMessage {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  text: string;
  sourceType: AllowedAssistantSourceType;
  createdAt: string;
  meta?: AssistantResponseMeta | null;
}

export interface AssistantSendResponse {
  conversationId: string;
  userRecord: AssistantHistoryMessage;
  aiRecord: AssistantHistoryMessage;
  structured: AssistantStructuredResponse;
}
