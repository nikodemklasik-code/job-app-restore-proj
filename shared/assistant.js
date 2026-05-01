/**
 * Canonical assistant contracts (types + runtime const arrays for bundlers).
 * Node ESM in this repo imports `shared/assistant.js` — keep that file’s **const exports**
 * aligned with the arrays here (see header in `assistant.js`); do not fork values manually.
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
