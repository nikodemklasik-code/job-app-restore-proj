import type { MySql2Database } from 'drizzle-orm/mysql2';
import type * as schema from '../../db/schema.js';
import type { TransactionManager } from './transaction-manager.js';

type AppDb = MySql2Database<typeof schema>;

export class DrizzleTransactionManager implements TransactionManager {
  constructor(private readonly db: AppDb) {}

  async runInTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(tx as AppDb));
  }
}
