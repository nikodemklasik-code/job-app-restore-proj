/**
 * Employer Intelligence Service
 *
 * Manages employer records, sources, and signal detection across 9 verification
 * categories (A–I). Provides findOrCreate with name normalization and domain matching.
 */

import { randomUUID } from 'crypto';
import { and, eq, like } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
    employers,
    employerSignals,
    employerSources,
} from '../../db/schemas/skills-matrix.js';
import { buildTrustMetadata } from '../skillMatrix/trustMetadata.js';
import type {
    EmployerProfile,
    EmployerSignalRecord,
    EmployerSignalSeverity,
    EmployerSourceRecord,
    EmployerSourceType,
    SignalCategory,
    TrustMetadata,
} from '../skillMatrix/types.js';

// ── Employer Name Normalization ──────────────────────────────────────────────

const COMPANY_SUFFIXES = /\b(ltd|limited|plc|inc|incorporated|corp|corporation|llc|llp|gmbh|ag|sa|pty|co)\b\.?/gi;

/**
 * Normalize employer name for matching.
 * Idempotent: normalize(normalize(x)) === normalize(x)
 */
export function normalizeEmployerName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(COMPANY_SUFFIXES, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract domain from a URL for employer matching.
 */
function extractDomain(url: string | null): string | null {
    if (!url) return null;
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

// ── Core Service Functions ───────────────────────────────────────────────────

/**
 * Find an existing employer or create a new one.
 * Matches by normalized name or domain.
 */
export async function findOrCreateEmployer(
    name: string,
    website?: string | null,
): Promise<{ id: string; name: string; normalizedName: string; isNew: boolean }> {
    const normalizedName = normalizeEmployerName(name);

    // Try normalized name match
    const existing = await db
        .select()
        .from(employers)
        .where(eq(employers.normalizedName, normalizedName))
        .limit(1);

    if (existing.length > 0) {
        return {
            id: existing[0].id,
            name: existing[0].name,
            normalizedName: existing[0].normalizedName,
            isNew: false,
        };
    }

    // Try domain match if website provided
    if (website) {
        const domain = extractDomain(website);
        if (domain) {
            const domainMatch = await db
                .select()
                .from(employers)
                .where(like(employers.website, `%${domain}%`))
                .limit(1);

            if (domainMatch.length > 0) {
                return {
                    id: domainMatch[0].id,
                    name: domainMatch[0].name,
                    normalizedName: domainMatch[0].normalizedName,
                    isNew: false,
                };
            }
        }
    }

    // Create new employer
    const id = randomUUID();
    await db.insert(employers).values({
        id,
        name,
        normalizedName,
        website: website ?? null,
        market: 'uk',
        registryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return { id, name, normalizedName, isNew: true };
}

/**
 * Add a source record for an employer.
 */
export async function addSource(
    employerId: string,
    source: {
        sourceType: EmployerSourceType;
        sourceName: string;
        sourceUrl?: string | null;
        observedAt: Date;
        confidence: number;
        rawData?: Record<string, unknown>;
    },
): Promise<string> {
    const id = randomUUID();
    await db.insert(employerSources).values({
        id,
        employerId,
        sourceType: source.sourceType,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl ?? null,
        observedAt: source.observedAt,
        confidence: String(source.confidence),
        rawData: source.rawData ?? null,
        createdAt: new Date(),
    });
    return id;
}

/**
 * Store detected signals for an employer.
 */
export async function addSignals(
    employerId: string,
    signals: Array<{
        category: SignalCategory;
        signalType: string;
        score: number;
        severity: EmployerSignalSeverity;
        title: string;
        explanation: string;
        sourceId?: string | null;
        trustMetadata: TrustMetadata;
    }>,
): Promise<void> {
    if (signals.length === 0) return;

    await db.insert(employerSignals).values(
        signals.map((s) => ({
            id: randomUUID(),
            employerId,
            category: s.category,
            signalType: s.signalType,
            score: s.score,
            severity: s.severity,
            title: s.title,
            explanation: s.explanation,
            sourceId: s.sourceId ?? null,
            trustMetadata: s.trustMetadata,
            createdAt: new Date(),
            expiresAt: null,
        })),
    );
}

/**
 * Get full employer profile with sources and signals.
 */
export async function getEmployerProfile(employerId: string): Promise<EmployerProfile | null> {
    const employerRows = await db
        .select()
        .from(employers)
        .where(eq(employers.id, employerId))
        .limit(1);

    if (employerRows.length === 0) return null;
    const employer = employerRows[0];

    const sources = await db
        .select()
        .from(employerSources)
        .where(eq(employerSources.employerId, employerId));

    const signals = await db
        .select()
        .from(employerSignals)
        .where(eq(employerSignals.employerId, employerId));

    return {
        id: employer.id,
        name: employer.name,
        normalizedName: employer.normalizedName,
        website: employer.website,
        market: employer.market,
        registryId: employer.registryId,
        sources: sources.map((s) => ({
            id: s.id,
            employerId: s.employerId,
            sourceType: s.sourceType as EmployerSourceType,
            sourceName: s.sourceName,
            sourceUrl: s.sourceUrl,
            observedAt: s.observedAt,
            confidence: parseFloat(s.confidence),
        })),
        signals: signals.map((s) => ({
            id: s.id,
            employerId: s.employerId,
            signalType: s.signalType,
            category: s.category as SignalCategory,
            score: s.score,
            severity: s.severity as EmployerSignalSeverity,
            title: s.title,
            explanation: s.explanation,
            sourceId: s.sourceId,
            trustMetadata: s.trustMetadata as TrustMetadata,
            createdAt: s.createdAt,
        })),
        trustScore: null, // Computed on demand by scoring service
        riskScore: null,
    };
}

/**
 * Get signals by category for an employer.
 */
export async function getSignalsByCategory(
    employerId: string,
    category?: SignalCategory,
): Promise<EmployerSignalRecord[]> {
    const conditions = [eq(employerSignals.employerId, employerId)];
    if (category) {
        conditions.push(eq(employerSignals.category, category));
    }

    const rows = await db
        .select()
        .from(employerSignals)
        .where(and(...conditions));

    return rows.map((s) => ({
        id: s.id,
        employerId: s.employerId,
        signalType: s.signalType,
        category: s.category as SignalCategory,
        score: s.score,
        severity: s.severity as EmployerSignalSeverity,
        title: s.title,
        explanation: s.explanation,
        sourceId: s.sourceId,
        trustMetadata: s.trustMetadata as TrustMetadata,
        createdAt: s.createdAt,
    }));
}

/**
 * Find employer by name (normalized search).
 */
export async function findEmployerByName(name: string): Promise<EmployerProfile | null> {
    const normalized = normalizeEmployerName(name);
    const rows = await db
        .select()
        .from(employers)
        .where(eq(employers.normalizedName, normalized))
        .limit(1);

    if (rows.length === 0) return null;
    return getEmployerProfile(rows[0].id);
}
