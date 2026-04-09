"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forbiddenAssistantSourceTypes = exports.allowedAssistantSourceTypes = exports.assistantModes = void 0;
exports.assistantModes = ['general', 'cv', 'interview', 'salary'];
exports.allowedAssistantSourceTypes = [
    'manual_user_input',
    'linkedin_profile_table',
    'linkedin_public_post_table',
    'facebook_page_post_table',
    'instagram_business_post_table',
    'job_listing_table',
];
exports.forbiddenAssistantSourceTypes = [
    'linkedin_inmail_thread',
    'facebook_messenger_thread',
    'instagram_dm_thread',
    'raw_private_messages',
];
