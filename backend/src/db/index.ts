import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { attachMysqlClosedStateGuard } from '../runtime/mysql-closed-state-guard.js';
import * as schema from './schema.js';

// Load .env early — ESM hoists imports before server.ts dotenv.config() runs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') }); // dist/backend/src/db/ (5 up) → repo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });   // dist/backend/src/db/ (4 up) → backend/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });      // dist/src/db/ (legacy, 3 up)

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL');

let connection;
try {
  connection = await createConnection(connectionString);
} catch (err) {
  console.error('[mysql] initial connect failed (unavailable, DNS, refused, or bad DATABASE_URL)', err);
  if (process.env.NODE_ENV === 'test') throw err;
  process.exit(1);
}
attachMysqlClosedStateGuard(connection);
export const db = drizzle(connection, { schema, mode: 'default' });
