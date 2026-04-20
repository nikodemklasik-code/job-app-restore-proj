/**
 * Hermetic Coach router tests — **no live MySQL**, **no `appRouter` import**.
 *
 * QC requirement: `docs/qc-reports/qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md` (hermetic test gate).
 * vitest must not pull `mysql2` at module load. We only compose `router({ coach: coachRouter })`
 * and mock `db` + `creditsBilling` before importing `coach.router` (hoisted `vi.mock`).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { approveSpendMock, commitSpendMock, rejectSpendMock, BillingErrorMock } = vi.hoisted(() => {
  const approveSpendMock = vi.fn();
  const commitSpendMock = vi.fn();
  const rejectSpendMock = vi.fn();
  class BillingErrorMock extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = 'BillingError';
      this.code = code;
    }
  }
  return { approveSpendMock, commitSpendMock, rejectSpendMock, BillingErrorMock };
});

vi.mock('../../../db/index.js', () => ({
  db: {},
}));

vi.mock('../../../lib/clerk.js', () => ({
  authenticateRequest: async () => null,
  getOrCreateAppUser: async (clerkUserId: string) => ({
    id: 'local-user',
    clerkId: clerkUserId,
    email: 't@test.com',
  }),
}));

vi.mock('../../../services/creditsBilling.js', () => ({
  approveSpend: (...args: unknown[]) => approveSpendMock(...args),
  commitSpend: (...args: unknown[]) => commitSpendMock(...args),
  rejectSpend: (...args: unknown[]) => rejectSpendMock(...args),
  BillingError: BillingErrorMock,
}));

vi.mock('../../../lib/openai/openai.client.js', () => ({
  tryGetOpenAiClient: () => null,
}));

import { router } from '../../trpc.js';
import { coachRouter } from '../coach.router.js';

const testApp = router({ coach: coachRouter });

describe('coachRouter.evaluateAnswer (hermetic)', () => {
  beforeEach(() => {
    approveSpendMock.mockReset();
    commitSpendMock.mockReset();
    rejectSpendMock.mockReset();
    approveSpendMock.mockResolvedValue({
      spendEventId: 'spend-test-evt',
      feature: 'coach_session',
      kind: 'estimated',
      approvedMaxCost: 5,
      estimatedCost: 5,
      balances: {
        plan: 'free',
        credits: 10,
        allowance: { limit: 50, remaining: 40, periodStart: null, periodEnd: null },
        spendableTotal: 50,
        usedThisMonth: { fromAllowance: 0, fromCredits: 0, total: 0 },
      },
    });
    commitSpendMock.mockResolvedValue({
      spendEventId: 'spend-test-evt',
      actualCost: 5,
      balances: {
        plan: 'free',
        credits: 5,
        allowance: { limit: 50, remaining: 35, periodStart: null, periodEnd: null },
        spendableTotal: 40,
        usedThisMonth: { fromAllowance: 5, fromCredits: 0, total: 5 },
      },
    });
    rejectSpendMock.mockResolvedValue({ spendEventId: 'spend-test-evt' });
  });

  it('approves coach_session in middleware, returns heuristic feedback, then commitSpend (not rejectSpend)', async () => {
    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_coach_test', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_coach_test', email: 'coach@test.local' },
    });

    const result = await caller.coach.evaluateAnswer({
      category: 'behavioural',
      question: 'Tell me about a time you led a project.',
      answer:
        'At my previous company I led a migration that reduced downtime by 40% and the team adopted the new stack within two months.',
    });

    expect(result.creditsUsed).toBe(5);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_coach_test',
        feature: 'coach_session',
      }),
    );
    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_coach_test',
        spendEventId: 'spend-test-evt',
        actualCost: 5,
      }),
    );
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });

  it('does not call OpenAI path or commit when approveSpend fails (INSUFFICIENT_FUNDS)', async () => {
    approveSpendMock.mockRejectedValueOnce(new BillingErrorMock('INSUFFICIENT_FUNDS', 'Not enough credits'));

    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_poor', sessionId: null },
      user: { id: 'user-row-2', clerkId: 'clerk_poor', email: 'poor@test.local' },
    });

    await expect(
      caller.coach.evaluateAnswer({
        category: 'behavioural',
        question: 'Q?',
        answer: 'A',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(commitSpendMock).not.toHaveBeenCalled();
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });
});
