import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fullName: text('full_name').notNull().default(''),
  phone: text('phone'),
  summary: text('summary'),
  avatarUrl: text('avatar_url'),
  readinessScore: integer('readiness_score').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const experiences = pgTable('experiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  employerName: text('employer_name').notNull(),
  jobTitle: text('job_title').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const educations = pgTable('educations', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  schoolName: text('school_name').notNull(),
  degree: text('degree').notNull(),
  fieldOfStudy: text('field_of_study'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  name: text('name').notNull(),
  level: integer('level').default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  mode: text('mode').notNull(),
  difficulty: text('difficulty').notNull(),
  status: text('status').default('completed').notNull(),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviewAnswers = pgTable('interview_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => interviewSessions.id).notNull(),
  questionId: text('question_id').notNull(),
  transcript: text('transcript').notNull(),
  metrics: jsonb('metrics').notNull(),
  feedback: jsonb('feedback').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assistantConversations = pgTable('assistant_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  messageCount: integer('message_count').default(0),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  credits: integer('credits').default(100),
  renewalDate: timestamp('renewal_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activeSessions = pgTable('active_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  device: text('device').notNull(),
  location: text('location').notNull(),
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
