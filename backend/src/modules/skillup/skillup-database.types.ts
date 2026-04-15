import type { MySql2Database } from 'drizzle-orm/mysql2';
import type * as schema from '../../db/schema.js';

/** Drizzle MySQL client for SkillUp persistence (same schema root as JobRadar). */
export type SkillUpDb = MySql2Database<typeof schema>;
