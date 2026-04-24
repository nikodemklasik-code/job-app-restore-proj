/**
 * Hermetic Community Centre helpers — no live MySQL, no Clerk.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/clerk.js', () => ({
  authenticateRequest: async () => null,
  getOrCreateAppUser: async () => ({ id: 'u1', clerkId: 'c1', email: 't@test.com' }),
}));

import {
  buildCommunityActionAck,
  buildCommunityReferralLink,
  buildCommunitySnapshot,
} from '../community.router.js';

describe('community router helpers', () => {
  it('builds a stable referral link from a user id', () => {
    const link = buildCommunityReferralLink('user-123_ABC', 'https://example.test/');
    expect(link).toBe('https://example.test/ref/user123ABC');
  });

  it('falls back to member referral code when user id has no alphanumeric characters', () => {
    const link = buildCommunityReferralLink('---', 'https://example.test');
    expect(link).toBe('https://example.test/ref/member');
  });

  it('builds a populated community snapshot with deterministic generatedAt', () => {
    const snapshot = buildCommunitySnapshot('user-123', new Date('2026-04-24T10:00:00.000Z'));
    expect(snapshot.generatedAt).toBe('2026-04-24T10:00:00.000Z');
    expect(snapshot.events.length).toBeGreaterThan(0);
    expect(snapshot.featuredOutcomes.length).toBeGreaterThan(0);
    expect(snapshot.trending.length).toBeGreaterThan(0);
  });

  it('acknowledges tracked community action', () => {
    const ack = buildCommunityActionAck('copy_referral_link');
    expect(ack.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ack.action).toBe('copy_referral_link');
    expect(new Date(ack.acknowledgedAt).toString()).not.toBe('Invalid Date');
  });
});
