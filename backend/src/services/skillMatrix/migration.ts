/**
 * Legacy Skills Migration Service
 *
 * Converts existing `skills` table rows into the new evidence-based model.
 * Idempotent — re-running does not create duplicate evidence records.
 * Also seeds employer records from existing job company names.
 */

import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { profiles, skills } from '../../db/schema.js';
import { skillEvidence as skillEvidenceTable } from '../../db/schemas/skillup.js';
import { findOrCreateEmployer } from '../employerIntel/employerIntel.service.js';
import { resolveSkill } from './skillTaxonomy.service.js';

// ── User Skills Migration ────────────────────────────────────────────────────

export interface MigrationResult {
    userId: string;
    skillsMigrated: number;
    skillsSkipped: number;
    errors: string[];
}

/**
 * Migrate a single user's legacy skills to the evidence model.
 *
 * For each existing `skills` row:
 * 1. Resolve the skill name to a canonical taxonomy entry
 * 2. Create a `skill_evidence` record with evidenceType: 'declared', sourceType: 'profile'
 * 3. Skip if evidence already exists for this (userId, skillKey) from 'profile' source
 *
 * Idempotent: safe to re-run.
 */
export async function migrateUserSkillsToEvidence(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
        userId,
        skillsMigrated: 0,
        skillsSkipped: 0,
        errors: [],
    };

    // Find the user's profile
    const profileRows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

    if (profileRows.length === 0) {
        result.errors.push('No profile found for user');
        return result;
    }

    const profileId = profileRows[0].id;

    // Get all legacy skills for this profile
    const legacySkills = await db
        .select()
        .from(skills)
        .where(eq(skills.profileId, profileId));

    if (legacySkills.length === 0) {
        return result;
    }

    for (const skill of legacySkills) {
        try {
            // Resolve to canonical taxonomy
            const resolved = await resolveSkill(skill.name);

            // Check if evidence already exists (idempotency)
            const existing = await db
                .select()
                .from(skillEvidenceTable)
                .where(
                    and(
                        eq(skillEvidenceTable.userId, userId),
                        eq(skillEvidenceTable.skillKey, resolved.canonicalId),
                        eq(skillEvidenceTable.sourceType, 'cv'), // Using 'cv' as closest to 'profile' in existing enum
                    ),
                )
                .limit(1);

            if (existing.length > 0) {
                result.skillsSkipped++;
                continue;
            }

            // Create evidence record
            await db.insert(skillEvidenceTable).values({
                id: randomUUID(),
                userId,
                skillKey: resolved.canonicalId,
                sourceType: 'cv', // Closest available enum value to 'profile'
                sourceRefId: skill.id,
                evidenceDirection: 'supports',
                evidenceStrength: 'medium',
                observedLevel: mapLevelToObserved(skill.level),
                evidenceText: `User declared skill: ${skill.name} (migrated from legacy profile)`,
                structuredPayload: {
                    matrixEvidenceType: 'declared',
                    matrixConfidence: 0.5,
                    verifiedByUser: null,
                    evidenceUrl: null,
                    occurredAt: skill.createdAt?.toISOString() ?? null,
                    legacySkillId: skill.id,
                    legacyLevel: skill.level,
                    migratedAt: new Date().toISOString(),
                },
                freshnessScore: 40, // Assume moderate freshness for legacy data
                confidence: 'medium',
                createdAt: new Date(),
            });

            result.skillsMigrated++;
        } catch (error) {
            result.errors.push(
                `Failed to migrate skill "${skill.name}": ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    return result;
}

/**
 * Map legacy skill level (1-10) to SkillUp observed level enum.
 */
function mapLevelToObserved(level: number | null): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (!level || level <= 3) return 'basic';
    if (level <= 5) return 'intermediate';
    if (level <= 8) return 'advanced';
    return 'expert';
}

// ── Employer Seeding ─────────────────────────────────────────────────────────

/**
 * Seed employer records from existing job company names.
 * Reads unique company names from the jobs table and creates employer records.
 */
export async function migrateEmployersFromJobs(): Promise<{
    created: number;
    existing: number;
    errors: number;
}> {
    const result = { created: 0, existing: 0, errors: 0 };

    // Get unique company names from jobs table
    // Using raw SQL since the jobs table structure may vary
    try {
        const rows = await db.execute(
            `SELECT DISTINCT company FROM jobs WHERE company IS NOT NULL AND company != '' LIMIT 1000`,
        );

        const companies = (rows as any)[0] as Array<{ company: string }>;

        for (const row of companies) {
            try {
                const employer = await findOrCreateEmployer(row.company);
                if (employer.isNew) {
                    result.created++;
                } else {
                    result.existing++;
                }
            } catch {
                result.errors++;
            }
        }
    } catch (error) {
        console.error('[Migration] Error seeding employers from jobs:', error);
    }

    return result;
}

// ── Batch Migration ──────────────────────────────────────────────────────────

/**
 * Run migration for all users who have legacy skills but no evidence records.
 * Intended for one-time batch migration.
 */
export async function runBatchMigration(options: {
    limit?: number;
    dryRun?: boolean;
} = {}): Promise<{
    usersProcessed: number;
    totalMigrated: number;
    totalSkipped: number;
    errors: string[];
}> {
    const limit = options.limit ?? 100;
    const summary = {
        usersProcessed: 0,
        totalMigrated: 0,
        totalSkipped: 0,
        errors: [] as string[],
    };

    // Find users with legacy skills
    const usersWithSkills = await db.execute(
        `SELECT DISTINCT p.user_id FROM profiles p 
     INNER JOIN skills s ON s.profile_id = p.id 
     LIMIT ${limit}`,
    );

    const users = (usersWithSkills as any)[0] as Array<{ user_id: string }>;

    for (const user of users) {
        if (options.dryRun) {
            summary.usersProcessed++;
            continue;
        }

        const result = await migrateUserSkillsToEvidence(user.user_id);
        summary.usersProcessed++;
        summary.totalMigrated += result.skillsMigrated;
        summary.totalSkipped += result.skillsSkipped;
        summary.errors.push(...result.errors);
    }

    return summary;
}
