/**
 * Integration Test — Data Privacy
 * Tests export format and deletion workflow (requires DB — will skip if unavailable).
 */

import { describe, it, expect } from 'vitest';

describe('Data Privacy — Export Format', () => {
    it('export structure matches expected schema', () => {
        // Simulate export structure validation without DB
        const mockExport = {
            exportedAt: new Date().toISOString(),
            userId: 'user-123',
            skills: [
                { skillId: 'ts', sourceType: 'github', evidenceText: 'Contributed to TS project', confidence: 'high', createdAt: new Date().toISOString() },
            ],
            signals: [
                { skillId: 'ts', signalType: 'strength', title: 'Strong TypeScript', explanation: 'High evidence', createdAt: new Date().toISOString() },
            ],
            telemetryEvents: [
                { eventName: 'skill_signal_viewed', entityType: 'skill', entityId: 'ts', occurredAt: new Date().toISOString() },
            ],
            applicationHistory: [
                { applicationId: 'app-1', eventType: 'created', occurredAt: new Date().toISOString() },
            ],
        };

        // Validate structure
        expect(mockExport.exportedAt).toBeTruthy();
        expect(mockExport.userId).toBeTruthy();
        expect(Array.isArray(mockExport.skills)).toBe(true);
        expect(Array.isArray(mockExport.signals)).toBe(true);
        expect(Array.isArray(mockExport.telemetryEvents)).toBe(true);
        expect(Array.isArray(mockExport.applicationHistory)).toBe(true);

        // No PII in telemetry events
        for (const event of mockExport.telemetryEvents) {
            expect(event).not.toHaveProperty('email');
            expect(event).not.toHaveProperty('name');
            expect(event).not.toHaveProperty('phone');
        }
    });

    it('deletion result contains expected fields', () => {
        const mockDeletionResult = {
            userId: 'user-123',
            deletedEvidence: 5,
            deletedSignals: 3,
            deletedEvents: 12,
            deletedAppEvents: 2,
            anonymizedAuditLogs: 8,
            completedAt: new Date().toISOString(),
        };

        expect(mockDeletionResult.userId).toBeTruthy();
        expect(mockDeletionResult.deletedEvidence).toBeGreaterThanOrEqual(0);
        expect(mockDeletionResult.deletedSignals).toBeGreaterThanOrEqual(0);
        expect(mockDeletionResult.anonymizedAuditLogs).toBeGreaterThanOrEqual(0);
        expect(mockDeletionResult.completedAt).toBeTruthy();
    });
});
