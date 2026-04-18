/**
 * Hermetic Live Interview billing tests — no live MySQL, no `appRouter`.
 * Sync: `liveInterview.router.ts` spend paths + `docs/qc-reports/qc-verdict-live-interview-billing-slice-2026-04-21.md`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const DRIZZLE_NAME = Symbol.for('drizzle:Name');

function tableName(t: unknown): string | undefined {
  if (t && typeof t === 'object' && DRIZZLE_NAME in t) {
    return (t as Record<symbol, string>)[DRIZZLE_NAME];
  }
  return undefined;
}

const {
  approveSpendMock,
  commitSpendMock,
  rejectSpendMock,
  BillingErrorMock,
  createSessionMock,
  getSessionMock,
  completeSessionMock,
  abandonSessionMock,
  dbUpdateWhereMock,
  liTestGate,
} = vi.hoisted(() => {
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
  const createSessionMock = vi.fn();
  const getSessionMock = vi.fn();
  const completeSessionMock = vi.fn();
  const abandonSessionMock = vi.fn();
  const dbUpdateWhereMock = vi.fn(() => Promise.resolve());
  const liTestGate = { failPendingUpdate: false };
  return {
    approveSpendMock,
    commitSpendMock,
    rejectSpendMock,
    BillingErrorMock,
    createSessionMock,
    getSessionMock,
    completeSessionMock,
    abandonSessionMock,
    dbUpdateWhereMock,
    liTestGate,
  };
});

vi.mock('../../../db/index.js', () => ({
  db: {
    update: () => ({
      set: (vals: Record<string, unknown>) => ({
        where: () => {
          if ('pendingCreditSpendEventId' in vals && liTestGate.failPendingUpdate) {
            return Promise.reject(new Error('simulated_pending_row_write_failed'));
          }
          return dbUpdateWhereMock();
        },
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
    select: () => ({
      from: (t: unknown) => ({
        where: () => ({
          limit: () => {
            const n = tableName(t);
            if (n === 'credit_spend_events') {
              return Promise.resolve([{ feature: 'interview_lite' }]);
            }
            if (n === 'live_interview_sessions') {
              return Promise.resolve([{ pending: 'spend-live-evt' }]);
            }
            return Promise.resolve([]);
          },
        }),
      }),
    }),
  },
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

vi.mock('../../../services/liveInterviewEngine.js', () => ({
  InterviewStatus: {
    CREATED: 'CREATED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    ABANDONED: 'ABANDONED',
  },
  createSession: (...args: unknown[]) => createSessionMock(...args),
  startSession: vi.fn(),
  processTurn: vi.fn(),
  completeSession: (...args: unknown[]) => completeSessionMock(...args),
  getSession: (...args: unknown[]) => getSessionMock(...args),
  abandonSession: (...args: unknown[]) => abandonSessionMock(...args),
}));

import { router } from '../../trpc.js';
import { liveInterviewRouter } from '../liveInterview.router.js';

const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const testApp = router({ liveInterview: liveInterviewRouter });

function baseSession(overrides: Partial<{ status: string }> = {}) {
  return {
    id: SESSION_ID,
    userId: 'user-row-id',
    status: overrides.status ?? 'CREATED',
    stage: 'INTRO',
    roleContext: { targetRole: 'Engineer' },
    config: { mode: 'general', maxTurns: 12, maxFollowUpsPerTopic: 2 },
    turnCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    memory: {},
    transcript: [],
  };
}

describe('liveInterviewRouter billing (hermetic)', () => {
  beforeEach(() => {
    liTestGate.failPendingUpdate = false;
    approveSpendMock.mockReset();
    commitSpendMock.mockReset();
    rejectSpendMock.mockReset();
    createSessionMock.mockReset();
    getSessionMock.mockReset();
    completeSessionMock.mockReset();
    abandonSessionMock.mockReset();
    dbUpdateWhereMock.mockReset();
    dbUpdateWhereMock.mockResolvedValue(undefined);

    approveSpendMock.mockResolvedValue({
      spendEventId: 'spend-live-evt',
      feature: 'interview_lite',
      kind: 'estimated',
      approvedMaxCost: 7,
      estimatedCost: 4,
      balances: {
        plan: 'free',
        credits: 20,
        allowance: { limit: 50, remaining: 40, periodStart: null, periodEnd: null },
        spendableTotal: 60,
        usedThisMonth: { fromAllowance: 0, fromCredits: 0, total: 0 },
      },
    });
    commitSpendMock.mockResolvedValue({
      spendEventId: 'spend-live-evt',
      actualCost: 4,
      balances: {
        plan: 'free',
        credits: 16,
        allowance: { limit: 50, remaining: 40, periodStart: null, periodEnd: null },
        spendableTotal: 56,
        usedThisMonth: { fromAllowance: 4, fromCredits: 0, total: 4 },
      },
    });
    rejectSpendMock.mockResolvedValue({ spendEventId: 'spend-live-evt' });

    createSessionMock.mockImplementation(async (uid: string, mode: string) => ({
      ...baseSession({ status: 'CREATED' }),
      id: SESSION_ID,
      userId: uid,
      config: { mode, maxTurns: 12, maxFollowUpsPerTopic: 2 },
    }));
  });

  it('createSession calls approveSpend with interview_standard for behavioral mode', async () => {
    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_li', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_li', email: 'li@test.local' },
    });

    await caller.liveInterview.createSession({
      mode: 'behavioral',
      roleContext: { targetRole: 'Backend Engineer' },
    });

    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_li',
        feature: 'interview_standard',
        referenceId: SESSION_ID,
      }),
    );
    expect(commitSpendMock).not.toHaveBeenCalled();
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });

  it('createSession rolls back when approveSpend fails (no rejectSpend without approval)', async () => {
    approveSpendMock.mockRejectedValueOnce(new BillingErrorMock('INSUFFICIENT_FUNDS', 'no credits'));

    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_li', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_li', email: 'li@test.local' },
    });

    await expect(
      caller.liveInterview.createSession({
        mode: 'general',
        roleContext: { targetRole: 'Engineer' },
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(rejectSpendMock).not.toHaveBeenCalled();
    expect(commitSpendMock).not.toHaveBeenCalled();
  });

  it('createSession calls rejectSpend then rollback when pending row update fails after approveSpend', async () => {
    liTestGate.failPendingUpdate = true;

    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_li', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_li', email: 'li@test.local' },
    });

    await expect(
      caller.liveInterview.createSession({
        mode: 'general',
        roleContext: { targetRole: 'Engineer' },
      }),
    ).rejects.toThrow('simulated_pending_row_write_failed');

    expect(rejectSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_li',
        spendEventId: 'spend-live-evt',
        reason: 'pending_row_write_failed',
      }),
    );
  });

  it('complete calls commitSpend with minCost after successful completeSession', async () => {
    getSessionMock.mockResolvedValue(baseSession({ status: 'ACTIVE' }));
    completeSessionMock.mockResolvedValue({
      summary: { headline: 'ok' },
      session: { ...baseSession({ status: 'COMPLETED' }), status: 'COMPLETED' },
    });

    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_li', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_li', email: 'li@test.local' },
    });

    await caller.liveInterview.complete({ sessionId: SESSION_ID });

    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_li',
        spendEventId: 'spend-live-evt',
        actualCost: 4,
      }),
    );
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });

  it('abandon on CREATED session calls rejectSpend and does not call abandonSession', async () => {
    getSessionMock.mockResolvedValue(baseSession({ status: 'CREATED' }));

    const caller = testApp.createCaller({
      req: {} as never,
      res: {} as never,
      auth: { clerkUserId: 'clerk_li', sessionId: null },
      user: { id: 'user-row-id', clerkId: 'clerk_li', email: 'li@test.local' },
    });

    await caller.liveInterview.abandon({ sessionId: SESSION_ID });

    expect(rejectSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_li',
        spendEventId: 'spend-live-evt',
      }),
    );
    expect(abandonSessionMock).not.toHaveBeenCalled();
  });
});
