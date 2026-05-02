import { randomUUID } from 'crypto';

type ProviderLogEvent = {
    provider: string;
    eventType: 'search_success' | 'search_failure' | 'structure_change' | 'parsing_error';
    query?: string;
    location?: string;
    jobsFound?: number;
    parsingMethod?: 'next_data_json' | 'structured_data' | 'html_regex' | 'api';
    errorMessage?: string;
    responseTimeMs?: number;
    httpStatus?: number;
    metadata?: Record<string, unknown>;
};

/**
 * Log provider events to database for monitoring and alerting
 * Helps detect when job board providers change their structure
 */
export async function logProviderEvent(event: ProviderLogEvent): Promise<void> {
    try {
        const { db } = await import('../../db/index.js');
        const { jobProviderLogs } = await import('../../db/schema.js');

        await db.insert(jobProviderLogs).values({
            id: randomUUID(),
            provider: event.provider,
            eventType: event.eventType,
            query: event.query,
            location: event.location,
            jobsFound: event.jobsFound ?? 0,
            parsingMethod: event.parsingMethod,
            errorMessage: event.errorMessage,
            responseTimeMs: event.responseTimeMs,
            httpStatus: event.httpStatus,
            metadata: event.metadata,
        });

        // Alert on structure changes
        if (event.eventType === 'structure_change' || event.eventType === 'parsing_error') {
            console.error(`[ProviderMonitoring] ${event.provider} ${event.eventType}:`, {
                parsingMethod: event.parsingMethod,
                error: event.errorMessage,
                metadata: event.metadata,
            });
        }
    } catch (err) {
        // Don't fail job search if logging fails
        console.error('[ProviderMonitoring] Failed to log event:', err);
    }
}

/**
 * Get recent provider health stats
 */
export async function getProviderHealth(provider?: string, days = 7): Promise<any[]> {
    try {
        const { db } = await import('../../db/index.js');
        const { sql } = await import('drizzle-orm');

        const query = provider
            ? sql`SELECT * FROM job_provider_health WHERE provider = ${provider} AND date >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`
            : sql`SELECT * FROM job_provider_health WHERE date >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;

        return await db.execute(query);
    } catch (err) {
        console.error('[ProviderMonitoring] Failed to get health stats:', err);
        return [];
    }
}

/**
 * Get recent structure changes (last 24h)
 */
export async function getRecentStructureChanges(): Promise<any[]> {
    try {
        const { db } = await import('../../db/index.js');
        const { sql } = await import('drizzle-orm');

        return await db.execute(sql`SELECT * FROM job_provider_structure_changes`);
    } catch (err) {
        console.error('[ProviderMonitoring] Failed to get structure changes:', err);
        return [];
    }
}
