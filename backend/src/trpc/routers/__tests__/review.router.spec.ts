/**
 * Hermetic review helpers — no live MySQL.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../db/index.js', () => ({ db: {} }));
vi.mock('../../../lib/clerk.js', () => ({ authenticateRequest: async () => null, getOrCreateAppUser: async () => ({ id: 'u1', clerkId: 'c1', email: 't@test.com' }) }));

import { mergeQueueWithJobs } from '../review.router.js';

const baseApp = {
  id: 'app-1',
  company: 'Acme',
  jobTitle: 'Engineer',
  status: 'sent' as const,
  silenceDays: 10,
  lastFollowedUpAt: null,
  jobId: null,
};

const baseJob = {
  id: 'job-1',
  title: 'Software Engineer',
  company: 'Acme Ltd',
  location: 'London',
  applyUrl: 'https://acme.example.com/apply',
  isActive: true,
};

describe('mergeQueueWithJobs', () => {
  it('returns null relatedJob when no jobs provided', () => {
    const result = mergeQueueWithJobs([baseApp], []);
    expect(result).toHaveLength(1);
    expect(result[0].relatedJob).toBeNull();
    expect(result[0].applicationId).toBe('app-1');
    expect(result[0].role).toBe('Engineer');
  });

  it('attaches relatedJob when jobId matches', () => {
    const app = { ...baseApp, jobId: 'job-1' };
    const result = mergeQueueWithJobs([app], [baseJob]);
    expect(result[0].relatedJob).not.toBeNull();
    expect(result[0].relatedJob?.title).toBe('Software Engineer');
    expect(result[0].relatedJob?.url).toBe('https://acme.example.com/apply');
  });

  it('returns null relatedJob when jobId has no matching job', () => {
    const app = { ...baseApp, jobId: 'job-999' };
    const result = mergeQueueWithJobs([app], [baseJob]);
    expect(result[0].relatedJob).toBeNull();
  });

  it('serializes lastFollowedUpAt to ISO string', () => {
    const date = new Date('2026-04-19T10:00:00.000Z');
    const app = { ...baseApp, lastFollowedUpAt: date };
    const result = mergeQueueWithJobs([app], []);
    expect(result[0].lastFollowedUpAt).toBe('2026-04-19T10:00:00.000Z');
  });

  it('returns null lastFollowedUpAt when not set', () => {
    const result = mergeQueueWithJobs([baseApp], []);
    expect(result[0].lastFollowedUpAt).toBeNull();
  });

  it('handles multiple applications with different jobs', () => {
    const apps = [
      { ...baseApp, id: 'app-1', jobId: 'job-1' },
      { ...baseApp, id: 'app-2', jobId: 'job-2' },
      { ...baseApp, id: 'app-3', jobId: null },
    ];
    const job2 = { ...baseJob, id: 'job-2', title: 'Product Manager' };
    const result = mergeQueueWithJobs(apps, [baseJob, job2]);
    expect(result[0].relatedJob?.title).toBe('Software Engineer');
    expect(result[1].relatedJob?.title).toBe('Product Manager');
    expect(result[2].relatedJob).toBeNull();
  });
});
