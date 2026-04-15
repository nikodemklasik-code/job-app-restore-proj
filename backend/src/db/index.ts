import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

// Load .env early — ESM hoists imports before server.ts dotenv.config() runs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') }); // dist/backend/src/db/ (5 up) → repo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });   // dist/backend/src/db/ (4 up) → backend/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });      // dist/src/db/ (legacy, 3 up)

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL');

const connection = await createConnection(connectionString);
export const db = drizzle(connection, { schema, mode: 'default' });
