/**
 * Abstraction for atomic multi-table writes (e.g. scan + report + outbox).
 * The session type is implementation-specific (Drizzle transaction client, etc.).
 */
export interface TransactionManager {
  runInTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
