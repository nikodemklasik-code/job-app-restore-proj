import type { MySql2Database } from 'drizzle-orm/mysql2';
import type * as schema from '../../db/schema.js';

/** Drizzle MySQL client (also compatible with transaction executor for CRUD in this module). */
export type JobRadarDb = MySql2Database<typeof schema>;
