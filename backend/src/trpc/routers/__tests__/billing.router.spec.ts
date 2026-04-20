/**
 * Hermetic billing helpers — no live MySQL.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../db/index.js', () => ({ db: {} }));
vi.mock('../../../lib/clerk.js', () => ({ authenticateRequest: async () => null, getOrCreateAppUser: async () => ({ id: 'u1', clerkId: 'c1', email: 't@test.com' }) }));
vi.mock('../../../services/stripe.js', () => ({}));
vi.mock('../../../services/paypal.js', () => ({ createPayPalOrder: vi.fn(), capturePayPalOrder: vi.fn() }));
vi.mock('../../../services/creditsBilling.js', () => ({ approveSpend: vi.fn(), commitSpend: vi.fn(), rejectSpend: vi.fn(), refundSpend: vi.fn(), getAccountState: vi.fn(), estimateAction: vi.fn(), getUsageHistory: vi.fn(), grantCreditPack: vi.fn(), listCreditPacks: vi.fn(), BillingError: class extends Error {} }));
vi.mock('../../../services/creditsConfig.js', () => ({ FEATURE_KEYS: ['interview_session'] as const, getCreditPack: vi.fn() }));
vi.mock('../../../modules/session-practice/warmupCredits.js', () => ({ isValidWarmupSessionDebit: vi.fn() }));

import { computeBillingSummary } from '../billing.router.js';

describe('computeBillingSummary', () => {
  it('returns zero summary for empty input', () => {
    const result = computeBillingSummary({ posted: [], pending: [] });
    expect(result.postedDebitCents).toBe(0);
    expect(result.postedCreditCents).toBe(0);
    expect(result.availableBalanceCents).toBe(0);
    expect(result.currency).toBe('GBP');
  });

  it('subtracts debits from credits for posted balance', () => {
    const result = computeBillingSummary({
      posted: [
        { direction: 'credit', amountCents: 2000, currency: 'GBP' },
        { direction: 'debit', amountCents: 750, currency: 'GBP' },
      ],
      pending: [],
    });
    expect(result.postedCreditCents).toBe(2000);
    expect(result.postedDebitCents).toBe(750);
    expect(result.postedNetCents).toBe(1250);
    expect(result.availableBalanceCents).toBe(1250);
  });

  it('reduces availableBalance by pending debits', () => {
    const result = computeBillingSummary({
      posted: [{ direction: 'credit', amountCents: 1000, currency: 'GBP' }],
      pending: [{ amountCents: 300, currency: 'GBP' }],
    });
    expect(result.postedNetCents).toBe(1000);
    expect(result.pendingDebitCents).toBe(300);
    expect(result.availableBalanceCents).toBe(700);
  });

  it('counts posted and pending entries', () => {
    const result = computeBillingSummary({
      posted: [
        { direction: 'credit', amountCents: 500, currency: 'GBP' },
        { direction: 'debit', amountCents: 100, currency: 'GBP' },
      ],
      pending: [
        { amountCents: 50, currency: 'GBP' },
        { amountCents: 75, currency: 'GBP' },
      ],
    });
    expect(result.postedCount).toBe(2);
    expect(result.pendingCount).toBe(2);
  });

  it('derives currency from first posted entry', () => {
    const result = computeBillingSummary({
      posted: [{ direction: 'credit', amountCents: 100, currency: 'EUR' }],
      pending: [],
    });
    expect(result.currency).toBe('EUR');
  });

  it('falls back to pending currency when no posted entries', () => {
    const result = computeBillingSummary({
      posted: [],
      pending: [{ amountCents: 100, currency: 'USD' }],
    });
    expect(result.currency).toBe('USD');
  });
});
