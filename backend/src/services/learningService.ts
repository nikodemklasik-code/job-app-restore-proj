import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import { learningSignals } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

export type Outcome = 'interview' | 'offer' | 'rejection';

export async function recordOutcome(
  userId: string,
  skills: string[],
  jobTitle: string,
  outcome: Outcome,
): Promise<void> {
  const type = outcome === 'rejection' ? 'negative' : 'positive';
  const weight = outcome === 'offer' ? 2.0 : outcome === 'interview' ? 1.5 : 1.0;

  const toInsert = [
    { id: randomUUID(), userId, signal: jobTitle.toLowerCase().trim(), type, weight: String(weight) },
    ...skills.slice(0, 10).map((s) => ({
      id: randomUUID(),
      userId,
      signal: s.toLowerCase().trim(),
      type,
      weight: String(weight * 0.5),
    })),
  ].filter((r) => r.signal.length > 1);

  if (toInsert.length === 0) return;
  await db.insert(learningSignals).values(toInsert);
}

export async function getLearnedSignals(userId: string): Promise<string[]> {
  const rows = await db
    .select({ signal: learningSignals.signal, type: learningSignals.type })
    .from(learningSignals)
    .where(and(eq(learningSignals.userId, userId), eq(learningSignals.type, 'positive')))
    .orderBy(desc(learningSignals.createdAt))
    .limit(50);

  // Count signal frequency
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.signal, (counts.get(r.signal) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([signal]) => signal);
}
