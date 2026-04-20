/**
 * Runtime mirror for Node / backend ESM (`import … from '…/shared/assistant.js'`).
 *
 * Single source of truth for **values** is `shared/assistant.ts` — when you change any
 * `export const …` array there, update this file the same way (or add a codegen step in CI).
 * Do not maintain divergent lists: missing keys here breaks intent validation at runtime.
 *
 * Types and interfaces live only in `assistant.ts`; this file is plain JS for resolution
 * without transpiling the shared folder.
 */

export const assistantModes = ['general', 'cv', 'interview', 'salary'];

export const allowedAssistantSourceTypes = [
  'manual_user_input',
  'linkedin_profile_table',
  'linkedin_public_post_table',
  'facebook_page_post_table',
  'instagram_business_post_table',
  'job_listing_table',
];

export const forbiddenAssistantSourceTypes = [
  'linkedin_inmail_thread',
  'facebook_messenger_thread',
  'instagram_dm_thread',
  'raw_private_messages',
];

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
];
