import { mysqlTable, varchar, text, timestamp, int, boolean, json, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/** Posted ledger + pending charges (optional; run `backend/sql/billing_ledger_pending_charges.sql` on MySQL). */
export const billingLedgerDirectionValues = ['debit', 'credit'] as const;
export const billingLedgerCategoryValues = [
  'subscription',
  'interview',
  'warmup',
  'coach',
  'negotiation',
  'skill_lab',
  'document_lab',
  'adjustment',
  'refund',
  'other',
] as const;
export const pendingChargeStatusValues = ['queued', 'authorized', 'committed', 'cancelled', 'failed'] as const;

export const billingLedger = mysqlTable('billing_ledger', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  direction: varchar('direction', { length: 16 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('GBP'),
  amountCents: int('amount_cents').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  quantity: int('quantity'),
  sourceType: varchar('source_type', { length: 64 }),
  sourceId: varchar('source_id', { length: 36 }),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const pendingCharges = mysqlTable('pending_charges', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  description: varchar('description', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('GBP'),
  amountCents: int('amount_cents').notNull(),
  sourceType: varchar('source_type', { length: 64 }),
  sourceId: varchar('source_id', { length: 36 }),
  expectedCommitAt: timestamp('expected_commit_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 320 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  // Data retention fields
  lastSeenAt: timestamp('last_seen_at'),
  retentionStatus: varchar('retention_status', { length: 30 }).default('active'),
  // Values: 'active' | 'inactive_warning_1' | 'inactive_warning_2' | 'scheduled_for_deletion' | 'deleted' | 'purged'
  deletionScheduledAt: timestamp('deletion_scheduled_at'),
  warning1SentAt: timestamp('warning1_sent_at'),
  warning2SentAt: timestamp('warning2_sent_at'),
  deletedAt: timestamp('deleted_at'),
  retentionExempt: boolean('retention_exempt').default(false),
});

export const profiles = mysqlTable('profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull().default(''),
  phone: varchar('phone', { length: 50 }),
  location: varchar('location', { length: 255 }),
  headline: varchar('headline', { length: 255 }),
  summary: text('summary'),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  cvUrl: varchar('cv_url', { length: 500 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  readinessScore: int('readiness_score').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const experiences = mysqlTable('experiences', {
  id: varchar('id', { length: 36 }).primaryKey(),
  profileId: varchar('profile_id', { length: 36 }).notNull(),
  employerName: varchar('employer_name', { length: 255 }).notNull(),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  startDate: varchar('start_date', { length: 20 }).notNull(),
  endDate: varchar('end_date', { length: 20 }),
  description: text('description'),
  achievements: json('achievements'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const educations = mysqlTable('educations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  profileId: varchar('profile_id', { length: 36 }).notNull(),
  schoolName: varchar('school_name', { length: 255 }).notNull(),
  degree: varchar('degree', { length: 255 }).notNull(),
  fieldOfStudy: varchar('field_of_study', { length: 255 }),
  startDate: varchar('start_date', { length: 20 }).notNull(),
  endDate: varchar('end_date', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = mysqlTable('skills', {
  id: varchar('id', { length: 36 }).primaryKey(),
  profileId: varchar('profile_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  level: int('level').default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trainings = mysqlTable('trainings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  profileId: varchar('profile_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  providerName: varchar('provider_name', { length: 255 }).notNull(),
  issuedAt: varchar('issued_at', { length: 20 }).notNull(),
  expiresAt: varchar('expires_at', { length: 20 }),
  credentialUrl: varchar('credential_url', { length: 500 }),
  relevanceScore: int('relevance_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const interviewSessions = mysqlTable('interview_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  mode: varchar('mode', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('completed').notNull(),
  score: int('score'),
  questionCount: int('question_count').notNull().default(3),
  recruiterPersona: varchar('recruiter_persona', { length: 255 }),
  selectedJobId: varchar('selected_job_id', { length: 36 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const interviewAnswers = mysqlTable('interview_answers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  questionId: varchar('question_id', { length: 255 }).notNull(),
  questionText: text('question_text').notNull().default(''),
  transcript: text('transcript').notNull(),
  metrics: json('metrics').notNull(),
  feedback: json('feedback').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assistantConversations = mysqlTable('assistant_conversations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  messageCount: int('message_count').default(0).notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assistantMessages = mysqlTable('assistant_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  text: text('text').notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull().default('manual_user_input'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  /** Paid credit balance carried across months. */
  credits: int('credits').default(100),
  /** Monthly free allowance — reset monthly from `allowancePeriodStart`. */
  allowanceLimit: int('allowance_limit').default(0).notNull(),
  allowanceRemaining: int('allowance_remaining').default(0).notNull(),
  allowancePeriodStart: timestamp('allowance_period_start'),
  renewalDate: timestamp('renewal_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/**
 * Credit spend events — audit trail for approve/commit/reject/refund (credits engine).
 */
export const creditSpendEvents = mysqlTable('credit_spend_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  feature: varchar('feature', { length: 64 }).notNull(),
  kind: varchar('kind', { length: 16 }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('approved'),
  estimatedCost: int('estimated_cost').default(0).notNull(),
  approvedMaxCost: int('approved_max_cost').default(0).notNull(),
  actualCost: int('actual_cost').default(0).notNull(),
  allowanceDebited: int('allowance_debited').default(0).notNull(),
  creditsDebited: int('credits_debited').default(0).notNull(),
  referenceId: varchar('reference_id', { length: 64 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const creditPackPurchases = mysqlTable('credit_pack_purchases', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  packSize: int('pack_size').notNull(),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
  provider: varchar('provider', { length: 32 }).notNull(),
  providerRef: varchar('provider_ref', { length: 128 }),
  status: varchar('status', { length: 16 }).notNull().default('completed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passkeys = mysqlTable('passkeys', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  credentialId: varchar('credential_id', { length: 500 }).notNull().unique(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activeSessions = mysqlTable('active_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  device: varchar('device', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  lastActive: timestamp('last_active').defaultNow().notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
  passkeys: many(passkeys),
  activeSessions: many(activeSessions),
  interviewSessions: many(interviewSessions),
  assistantConversations: many(assistantConversations),
  assistantMessages: many(assistantMessages),
}));

export const assistantConversationsRelations = relations(assistantConversations, ({ one, many }) => ({
  user: one(users, { fields: [assistantConversations.userId], references: [users.id] }),
  messages: many(assistantMessages),
}));

export const assistantMessagesRelations = relations(assistantMessages, ({ one }) => ({
  conversation: one(assistantConversations, { fields: [assistantMessages.conversationId], references: [assistantConversations.id] }),
  user: one(users, { fields: [assistantMessages.userId], references: [users.id] }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  experiences: many(experiences),
  educations: many(educations),
  skills: many(skills),
  trainings: many(trainings),
}));

export const trainingsRelations = relations(trainings, ({ one }) => ({
  profile: one(profiles, { fields: [trainings.profileId], references: [profiles.id] }),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, { fields: [interviewSessions.userId], references: [users.id] }),
  answers: many(interviewAnswers),
}));

export const interviewAnswersRelations = relations(interviewAnswers, ({ one }) => ({
  session: one(interviewSessions, { fields: [interviewAnswers.sessionId], references: [interviewSessions.id] }),
}));

// ── New tables ────────────────────────────────────────────────────────────────

export const jobs = mysqlTable('jobs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  externalId: varchar('external_id', { length: 255 }),
  source: varchar('source', { length: 50 }).notNull().default('manual'), // reed|adzuna|jooble|indeed|gumtree|manual
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  description: text('description'),
  applyUrl: varchar('apply_url', { length: 500 }),
  salaryMin: decimal('salary_min', { precision: 12, scale: 2 }),
  salaryMax: decimal('salary_max', { precision: 12, scale: 2 }),
  workMode: varchar('work_mode', { length: 50 }),
  requirements: json('requirements').$type<string[]>().default([]),
  fitScore: int('fit_score'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const applications = mysqlTable('applications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  jobId: varchar('job_id', { length: 36 }),
  jobTitle: varchar('job_title', { length: 255 }).notNull().default(''),
  company: varchar('company', { length: 255 }).notNull().default(''),
  jobDescription: text('job_description'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  fitScore: int('fit_score'),
  atsScore: int('ats_score'),
  keywordCoverage: int('keyword_coverage'),
  cvSnapshot: text('cv_snapshot'),
  coverLetterSnapshot: text('cover_letter_snapshot'),
  emailSentAt: timestamp('email_sent_at'),
  channel: varchar('channel', { length: 50 }).default('email'),
  notes: text('notes'),
  metadata: json('metadata'),
  silenceDays: int('silence_days').notNull().default(0),
  lastFollowedUpAt: timestamp('last_followed_up_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const applicationLogs = mysqlTable('application_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  applicationId: varchar('application_id', { length: 36 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  meta: json('meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const learningSignals = mysqlTable('learning_signals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  signal: varchar('signal', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('positive'),
  weight: decimal('weight', { precision: 5, scale: 2 }).default('1.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cvUploads = mysqlTable('cv_uploads', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  parsedText: text('parsed_text'),
  parsedData: json('parsed_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Stores user's browser session cookies for Indeed / Gumtree scraping
export const userJobSessions = mysqlTable('user_job_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'indeed' | 'gumtree'
  cookies: text('cookies').notNull(), // raw Cookie header string
  storageState: text('storage_state'), // Playwright storageState JSON (full session)
  isActive: boolean('is_active').default(true).notNull(),
  lastTestedAt: timestamp('last_tested_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Per-user email SMTP settings
export const userEmailSettings = mysqlTable('user_email_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  provider: varchar('provider', { length: 50 }).default('gmail'), // gmail|outlook|yahoo|icloud|custom
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: int('smtp_port').default(587),
  smtpUser: varchar('smtp_user', { length: 320 }),
  smtpPassEncrypted: text('smtp_pass_encrypted'), // base64 obfuscated (not true encryption — user accepts risk)
  fromName: varchar('from_name', { length: 255 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  lastVerifiedAt: timestamp('last_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Telegram notification settings per user
export const userTelegramSettings = mysqlTable('user_telegram_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  chatId: varchar('chat_id', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  notifyOnApply: boolean('notify_on_apply').default(true).notNull(),
  notifyOnReply: boolean('notify_on_reply').default(true).notNull(),
  notifyOnInterview: boolean('notify_on_interview').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Auto-apply queue (Autopilot plan)
export const autoApplyQueue = mysqlTable('auto_apply_queue', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  jobId: varchar('job_id', { length: 36 }),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  applyUrl: varchar('apply_url', { length: 500 }).notNull(),
  applyEmail: varchar('apply_email', { length: 320 }), // employer email for email-based apply
  source: varchar('source', { length: 50 }).default('indeed'),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending|processing|applied|failed|skipped
  fitScore: int('fit_score'),
  cvSnapshot: text('cv_snapshot'),    // generated CV text
  clSnapshot: text('cl_snapshot'),    // generated cover letter text
  errorMessage: text('error_message'),
  appliedAt: timestamp('applied_at'),
  sentAt: timestamp('sent_at'),       // when email was sent
  scheduledAt: timestamp('scheduled_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const jobSourceSettings = mysqlTable('job_source_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  providerName: varchar('provider_name', { length: 50 }).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  config: json('config'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const jobScrapeLogs = mysqlTable('job_scrape_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  providerName: varchar('provider_name', { length: 50 }).notNull(),
  query: varchar('query', { length: 255 }),
  jobCount: int('job_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Per-application IMAP inbox monitoring consent
export const emailMonitoring = mysqlTable('email_monitoring', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  applicationId: varchar('application_id', { length: 36 }).notNull(),
  // IMAP credentials (reuses SMTP user/pass from userEmailSettings when null)
  imapHost: varchar('imap_host', { length: 255 }),
  imapPort: int('imap_port').default(993),
  // Stored encrypted just like smtpPassEncrypted
  imapPassEncrypted: text('imap_pass_encrypted'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  isActive: boolean('is_active').default(true).notNull(),
  // Tracking last-checked UID to avoid re-processing old messages
  lastUid: int('last_uid').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Live Interview sessions (persistent store for liveInterviewEngine)
export const liveInterviewSessions = mysqlTable('live_interview_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('CREATED'),
  stage: varchar('stage', { length: 50 }).notNull().default('INTRO'),
  mode: varchar('mode', { length: 50 }).notNull(),
  // roleContext fields (denormalized for easy queries)
  targetRole: varchar('target_role', { length: 200 }).notNull(),
  company: varchar('company', { length: 200 }),
  seniority: varchar('seniority', { length: 100 }),
  roleDescription: text('role_description'),
  // config
  maxTurns: int('max_turns').notNull().default(12),
  maxFollowUpsPerTopic: int('max_follow_ups_per_topic').notNull().default(2),
  turnCount: int('turn_count').notNull().default(0),
  // rich state stored as JSON
  memory: json('memory').notNull(),
  summary: json('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  /** Approved credit_spend_events.id held until session completes or is abandoned */
  pendingCreditSpendEventId: varchar('pending_credit_spend_event_id', { length: 36 }),
});

export const liveInterviewTurns = mysqlTable('live_interview_turns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  speaker: varchar('speaker', { length: 20 }).notNull(), // 'assistant' | 'candidate'
  message: text('message').notNull(),
  intent: varchar('intent', { length: 50 }),
  nextAction: varchar('next_action', { length: 50 }),
  stage: varchar('stage', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Web Push subscriptions (VAPID)
export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  endpoint: varchar('endpoint', { length: 1000 }).notNull().unique(),
  p256dh: varchar('p256dh', { length: 500 }).notNull(),   // client public key
  auth: varchar('auth', { length: 255 }).notNull(),        // client auth secret
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ── NEW TABLES (v2 features) ──────────────────────────────────────────────────

// Document Lab — stores AI-extracted text (NOT binary/scan), encrypted at rest
// User uploads PDF/DOCX → AI extracts text → only text + metadata stored
export const documentUploads = mysqlTable('document_uploads', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  // Types: 'cv' | 'cover_letter' | 'certificate' | 'education' | 'portfolio' | 'session_memory' | 'other'
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  // AI-extracted plain text — encrypted with AES-256 using ENCRYPTION_KEY env var
  extractedTextEncrypted: text('extracted_text_encrypted'),
  // Structured data AI parsed from the document (skills, dates, companies etc.)
  parsedStructure: json('parsed_structure').$type<Record<string, unknown>>(),
  // Which profile fields were auto-filled from this document
  autoFilledFields: json('auto_filled_fields').$type<string[]>().default([]),
  // For session_memory type: coach / interview / negotiation
  sessionContext: varchar('session_context', { length: 50 }),
  isProcessed: boolean('is_processed').default(false).notNull(),
  processingError: varchar('processing_error', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Career goals & profile preferences (Dashboard Profil & Cele)
export const careerGoals = mysqlTable('career_goals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  currentJobTitle: varchar('current_job_title', { length: 255 }),
  currentSalary: int('current_salary'),                    // annual, GBP
  targetJobTitle: varchar('target_job_title', { length: 255 }),
  targetSalary: int('target_salary'),                      // annual, GBP
  targetSalaryMin: int('target_salary_min'),
  targetSalaryMax: int('target_salary_max'),
  targetSeniority: varchar('target_seniority', { length: 80 }),
  workValues: text('work_values'),                         // comma-separated: "remote, growth, stability"
  autoApplyMinScore: int('auto_apply_min_score').default(75), // 50–100%
  strategyJson: json('strategy_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const userPreferenceFlags = mysqlTable('user_preference_flags', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  caseStudyOptIn: boolean('case_study_opt_in').default(false).notNull(),
  communityVisibility: boolean('community_visibility').default(false).notNull(),
  referralParticipation: boolean('referral_participation').default(true).notNull(),
  sharedSessionsDiscoverable: boolean('shared_sessions_discoverable').default(false).notNull(),
  aiPersonalizationEnabled: boolean('ai_personalization_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/** Versioned content documents (CV drafts, cover letters, emails). Separate from documentUploads (file extraction). */
export const documentTypeValues = ['cv', 'cover_letter', 'email', 'other'] as const;

export const documents = mysqlTable('documents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  parentDocumentId: varchar('parent_document_id', { length: 36 }),
  version: int('version').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/** Saved jobs — user bookmarks. */
export const savedJobs = mysqlTable('saved_jobs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  jobId: varchar('job_id', { length: 36 }).notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
});

/** User job search preferences — remembers last search query and location. */
export const userJobPreferences = mysqlTable('user_job_preferences', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  lastQuery: varchar('last_query', { length: 255 }).default('').notNull(),
  lastLocation: varchar('last_location', { length: 255 }).default('United Kingdom').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/** AI recommendation feedback — persists helpful/not-helpful votes per user+job. */
export const aiJobRecommendationFeedback = mysqlTable('ai_job_recommendation_feedback', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  jobId: varchar('job_id', { length: 36 }).notNull(),
  feedback: varchar('feedback', { length: 16 }).notNull(), // 'up' | 'down'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/** Reports — interview/coach/manual/analysis notes. Run `backend/sql/2026-04-19-reports.sql`. */
export const reportSourceValues = ['interview', 'coach', 'manual', 'analysis'] as const;
export const reportStatusValues = ['open', 'closed'] as const;

export const reports = mysqlTable('reports', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  source: varchar('source', { length: 32 }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('open'),
  sourceReferenceId: varchar('source_reference_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

/** Product prefs (notifications, theme intent, assistant tone, blocked domains). Run `backend/sql/user_settings.sql`. */
export const themeModeValues = ['light', 'dark', 'system'] as const;
export const assistantToneValues = ['concise', 'balanced', 'detailed'] as const;

export const userSettings = mysqlTable('user_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(true),
  weeklyDigest: boolean('weekly_digest').notNull().default(true),
  marketingEmails: boolean('marketing_emails').notNull().default(false),
  autoSaveDocuments: boolean('auto_save_documents').notNull().default(true),
  darkMode: boolean('dark_mode').notNull().default(false),
  themeMode: varchar('theme_mode', { length: 16 }).notNull().default('system'),
  assistantTone: varchar('assistant_tone', { length: 16 }).notNull().default('balanced'),
  timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  privacyMode: boolean('privacy_mode').notNull().default(false),
  shareProfileAnalytics: boolean('share_profile_analytics').notNull().default(false),
  blockedCompanyDomains: json('blocked_company_domains').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Social media scan consents (LinkedIn / Facebook / Instagram)
export const socialConsents = mysqlTable('social_consents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  linkedinConsent: boolean('linkedin_consent').default(false).notNull(),
  facebookConsent: boolean('facebook_consent').default(false).notNull(),
  instagramConsent: boolean('instagram_consent').default(false).notNull(),
  linkedinGrantedAt: timestamp('linkedin_granted_at'),
  facebookGrantedAt: timestamp('facebook_granted_at'),
  instagramGrantedAt: timestamp('instagram_granted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Employer analysis cache — AI analysis per job posting
export const employerAnalysis = mysqlTable('employer_analysis', {
  id: varchar('id', { length: 36 }).primaryKey(),
  jobId: varchar('job_id', { length: 36 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  stabilityScore: int('stability_score'),   // 1–5
  cultureScore: int('culture_score'),       // 1–5
  growthScore: int('growth_score'),         // 1–5
  overallScore: int('overall_score'),       // 1–5
  summary: text('summary'),                 // AI-generated 2-3 sentence analysis
  sources: json('sources').$type<string[]>().default([]), // URLs used
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Referral program
export const referrals = mysqlTable('referrals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  referrerId: varchar('referrer_id', { length: 36 }).notNull(),   // who shared the link
  referredUserId: varchar('referred_user_id', { length: 36 }),    // who signed up (null until signup)
  referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // pending|signed_up|converted|rewarded
  rewardGrantedAt: timestamp('reward_granted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Job Provider Monitoring - tracks provider health and structure changes
export const jobProviderLogs = mysqlTable('job_provider_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'search_success', 'search_failure', 'structure_change', 'parsing_error'
  query: varchar('query', { length: 255 }),
  location: varchar('location', { length: 255 }),
  jobsFound: int('jobs_found').default(0),
  parsingMethod: varchar('parsing_method', { length: 50 }), // 'next_data_json', 'structured_data', 'html_regex', 'api'
  errorMessage: text('error_message'),
  responseTimeMs: int('response_time_ms'),
  httpStatus: int('http_status'),
  metadata: json('metadata'), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Test / demo accounts — unlimited access, no billing, not subject to retention
export const testAccounts = mysqlTable('test_accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),   // e.g. "QA Tester 1"
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 100 }).notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Job Radar module (Drizzle definitions live in `schemas/job-radar.ts`)
export * from './schemas/job-radar.js';
// SkillUp module (Drizzle definitions live in `schemas/skillup.ts`)
export * from './schemas/skillup.js';
