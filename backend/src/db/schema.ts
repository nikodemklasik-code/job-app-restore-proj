import { mysqlTable, varchar, text, timestamp, int, boolean, json, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 320 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const profiles = mysqlTable('profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull().default(''),
  phone: varchar('phone', { length: 50 }),
  summary: text('summary'),
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

export const interviewSessions = mysqlTable('interview_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  mode: varchar('mode', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('completed').notNull(),
  score: int('score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const interviewAnswers = mysqlTable('interview_answers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  questionId: varchar('question_id', { length: 255 }).notNull(),
  transcript: text('transcript').notNull(),
  metrics: json('metrics').notNull(),
  feedback: json('feedback').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assistantConversations = mysqlTable('assistant_conversations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  messageCount: int('message_count').default(0),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  credits: int('credits').default(100),
  renewalDate: timestamp('renewal_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  experiences: many(experiences),
  educations: many(educations),
  skills: many(skills),
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
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  fitScore: int('fit_score'),
  cvSnapshot: text('cv_snapshot'),
  coverLetterSnapshot: text('cover_letter_snapshot'),
  emailSentAt: timestamp('email_sent_at'),
  channel: varchar('channel', { length: 50 }).default('email'),
  notes: text('notes'),
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
  source: varchar('source', { length: 50 }).default('indeed'),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending|processing|applied|failed|skipped
  fitScore: int('fit_score'),
  errorMessage: text('error_message'),
  appliedAt: timestamp('applied_at'),
  scheduledAt: timestamp('scheduled_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
