import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { careerGoals } from '../db/schema.js';

export type ProfileMatchContext = {
  workValues: string[];
  minAutoApplyScore: number;
  targetJobTitle: string | null;
  targetSeniority: string | null;
  targetSalaryMin: number | null;
  targetSalaryMax: number | null;
  blockedAreas: string[];
};

function workValuesFromDb(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function strategyBlockedAreas(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const blocked = (raw as Record<string, unknown>).blockedAreas;
  if (!Array.isArray(blocked)) return [];
  return blocked.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

/**
 * Single read-model for profile-driven job filters (Job Radar, jobs list, auto-apply).
 */
export async function getProfileMatchContextByLocalId(userId: string): Promise<ProfileMatchContext> {
  const [row] = await db.select().from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  if (!row) {
    return {
      workValues: [],
      minAutoApplyScore: 75,
      targetJobTitle: null,
      targetSeniority: null,
      targetSalaryMin: null,
      targetSalaryMax: null,
      blockedAreas: [],
    };
  }
  const strategy = row.strategyJson && typeof row.strategyJson === 'object' ? row.strategyJson : {};
  return {
    workValues: workValuesFromDb(row.workValues),
    minAutoApplyScore: row.autoApplyMinScore ?? 75,
    targetJobTitle: row.targetJobTitle ?? null,
    targetSeniority: row.targetSeniority ?? null,
    targetSalaryMin: row.targetSalaryMin ?? null,
    targetSalaryMax: row.targetSalaryMax ?? null,
    blockedAreas: strategyBlockedAreas(strategy),
  };
}
