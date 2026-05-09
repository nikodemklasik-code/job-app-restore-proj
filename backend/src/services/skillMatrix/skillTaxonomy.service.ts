/**
 * Skill Taxonomy Service
 *
 * Manages the normalized skill dictionary with canonical names, categories,
 * aliases, and relationships. Resolves user-provided skill strings to canonical
 * entries using exact → alias → fuzzy matching.
 */

import { randomUUID } from 'crypto';
import { eq, like, or, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { skillRelationships, skillTaxonomy } from '../../db/schemas/skills-matrix.js';
import { SkillMatrixError } from './errors.js';
import type { CanonicalSkill, ResolvedSkill, SkillCategory, SkillRelationship } from './types.js';

/**
 * Normalize a skill name for matching: lowercase, trim, collapse whitespace.
 */
function normalizeForMatch(input: string): string {
    return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Simple Levenshtein distance for fuzzy matching.
 */
function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }
    return matrix[a.length][b.length];
}

/**
 * Resolve a user-provided skill string to a canonical skill entry.
 * Matching order: exact canonical name → alias match → fuzzy match → pending.
 */
export async function resolveSkill(input: string): Promise<ResolvedSkill> {
    const normalized = normalizeForMatch(input);

    // 1. Exact canonical name match
    const exactMatch = await db
        .select()
        .from(skillTaxonomy)
        .where(eq(skillTaxonomy.canonicalName, normalized))
        .limit(1);

    if (exactMatch.length > 0) {
        return {
            canonicalId: exactMatch[0].id,
            canonicalName: exactMatch[0].canonicalName,
            matchType: 'exact',
            confidence: 1.0,
        };
    }

    // 2. Alias match — search JSON aliases column
    const allSkills = await db.select().from(skillTaxonomy).where(eq(skillTaxonomy.status, 'active'));

    for (const skill of allSkills) {
        const aliases = (skill.aliases as string[]) ?? [];
        if (aliases.some((alias) => normalizeForMatch(alias) === normalized)) {
            return {
                canonicalId: skill.id,
                canonicalName: skill.canonicalName,
                matchType: 'alias',
                confidence: 0.95,
            };
        }
    }

    // 3. Fuzzy match — Levenshtein distance ≤ 2 for short names, ≤ 3 for longer
    let bestMatch: { skill: (typeof allSkills)[0]; distance: number } | null = null;

    for (const skill of allSkills) {
        const distance = levenshtein(normalized, normalizeForMatch(skill.canonicalName));
        const threshold = normalized.length <= 6 ? 2 : 3;

        if (distance <= threshold && (!bestMatch || distance < bestMatch.distance)) {
            bestMatch = { skill, distance };
        }

        // Also check aliases for fuzzy
        const aliases = (skill.aliases as string[]) ?? [];
        for (const alias of aliases) {
            const aliasDistance = levenshtein(normalized, normalizeForMatch(alias));
            if (aliasDistance <= threshold && (!bestMatch || aliasDistance < bestMatch.distance)) {
                bestMatch = { skill, distance: aliasDistance };
            }
        }
    }

    if (bestMatch) {
        const confidence = Math.max(0.5, 1.0 - bestMatch.distance * 0.15);
        return {
            canonicalId: bestMatch.skill.id,
            canonicalName: bestMatch.skill.canonicalName,
            matchType: 'fuzzy',
            confidence,
        };
    }

    // 4. No match — create pending entry
    const pending = await createPendingSkill(input);
    return {
        canonicalId: pending.id,
        canonicalName: pending.canonicalName,
        matchType: 'pending',
        confidence: 0.3,
    };
}

/**
 * Create a pending skill entry for unresolvable inputs.
 */
export async function createPendingSkill(name: string): Promise<CanonicalSkill> {
    const id = randomUUID();
    const canonicalName = normalizeForMatch(name);

    // Check if a pending entry already exists for this name
    const existing = await db
        .select()
        .from(skillTaxonomy)
        .where(eq(skillTaxonomy.canonicalName, canonicalName))
        .limit(1);

    if (existing.length > 0) {
        return rowToCanonicalSkill(existing[0]);
    }

    await db.insert(skillTaxonomy).values({
        id,
        canonicalName,
        category: 'tool', // Default category for pending review
        aliases: [],
        parentId: null,
        status: 'pending_review',
        metadata: { originalInput: name },
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return {
        id,
        canonicalName,
        category: 'tool',
        aliases: [],
        parentId: null,
        status: 'pending_review',
        createdAt: new Date(),
    };
}

/**
 * Get a canonical skill by ID.
 */
export async function getCanonicalSkill(id: string): Promise<CanonicalSkill | null> {
    const rows = await db.select().from(skillTaxonomy).where(eq(skillTaxonomy.id, id)).limit(1);
    if (rows.length === 0) return null;
    return rowToCanonicalSkill(rows[0]);
}

/**
 * Search skills by query string (prefix match on canonical name and aliases).
 */
export async function searchSkills(query: string, limit: number = 20): Promise<CanonicalSkill[]> {
    const normalized = normalizeForMatch(query);

    const rows = await db
        .select()
        .from(skillTaxonomy)
        .where(like(skillTaxonomy.canonicalName, `${normalized}%`))
        .limit(limit);

    return rows.map(rowToCanonicalSkill);
}

/**
 * Get related skills for a given skill ID.
 */
export async function getRelatedSkills(skillId: string): Promise<SkillRelationship[]> {
    const rows = await db
        .select()
        .from(skillRelationships)
        .where(
            or(
                eq(skillRelationships.fromSkillId, skillId),
                eq(skillRelationships.toSkillId, skillId),
            ),
        );

    return rows.map((r) => ({
        fromSkillId: r.fromSkillId,
        toSkillId: r.toSkillId,
        relationType: r.relationType as SkillRelationship['relationType'],
        strength: parseFloat(r.strength),
    }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToCanonicalSkill(row: typeof skillTaxonomy.$inferSelect): CanonicalSkill {
    return {
        id: row.id,
        canonicalName: row.canonicalName,
        category: row.category as SkillCategory,
        aliases: (row.aliases as string[]) ?? [],
        parentId: row.parentId,
        status: row.status as 'active' | 'pending_review',
        createdAt: row.createdAt,
    };
}
