/**
 * Hermetic reports helpers — no live MySQL.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../db/index.js', () => ({ db: {} }));
vi.mock('../../../lib/clerk.js', () => ({ authenticateRequest: async () => null, getOrCreateAppUser: async () => ({ id: 'u1', clerkId: 'c1', email: 't@test.com' }) }));

import { buildCreateReport } from '../reports.router.js';

describe('buildCreateReport', () => {
  it('sets status to open by default', () => {
    const row = buildCreateReport({ userId: 'u1', title: 'Test', content: 'Body', source: 'manual' });
    expect(row.status).toBe('open');
  });

  it('generates a uuid id', () => {
    const row = buildCreateReport({ userId: 'u1', title: 'T', content: 'C', source: 'interview' });
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('assigns sourceReferenceId when provided', () => {
    const row = buildCreateReport({ userId: 'u1', title: 'T', content: 'C', source: 'coach', sourceReferenceId: 'ref-123' });
    expect(row.sourceReferenceId).toBe('ref-123');
  });

  it('sets sourceReferenceId to null when omitted', () => {
    const row = buildCreateReport({ userId: 'u1', title: 'T', content: 'C', source: 'analysis' });
    expect(row.sourceReferenceId).toBeNull();
  });

  it('each call generates a unique id', () => {
    const a = buildCreateReport({ userId: 'u1', title: 'T', content: 'C', source: 'manual' });
    const b = buildCreateReport({ userId: 'u1', title: 'T', content: 'C', source: 'manual' });
    expect(a.id).not.toBe(b.id);
  });
});
