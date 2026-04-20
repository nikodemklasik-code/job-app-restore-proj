/**
 * Hermetic legacy interview.router billing — no MySQL, no appRouter.
 * Covers approveSpend on startSession, rollback + reject paths, commitSpend on completeSession.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { interviewSessions, interviewAnswers, creditSpendEvents, users } from '../../../db/schema.js';

const DRIZZLE_NAME = Symbol.for('drizzle:Name');

function tableName(t: unknown): string | undefined {
  if (t && typeof t === 'object' && DRIZZLE_NAME in t) {
    return (t as Record<symbol, string>)[DRIZZLE_NAME];
  }
  return undefined;
}

const { approveSpendMock, commitSpendMock, rejectSpendMock, BillingErrorMock, buildQuestionsThrow } =
  vi.hoisted(() => {
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
    const buildQuestionsThrow = { on: false };
    return { approveSpendMock, commitSpendMock, rejectSpendMock, BillingErrorMock, buildQuestionsThrow };
  });

const deleteWhereMock = vi.fn(() => Promise.resolve());
const insertValuesMock = vi.fn(() => Promise.resolve());
const updateWhereMock = vi.fn(() => Promise.resolve());

vi.mock('../../../db/index.js', () => ({
  db: {
    insert: () => ({
      values: () => insertValuesMock(),
    }),
    delete: () => ({
      where: () => deleteWhereMock(),
    }),
    update: () => ({
      set: () => ({
        where: () => updateWhereMock(),
      }),
    }),
    select: () => ({
      from: (t: unknown) => ({
        innerJoin: (_other: unknown, _on: unknown) => ({
          where: () => ({
            limit: () => {
              const n = tableName(t);
              if (n === 'credit_spend_events') {
                return Promise.resolve([{ id: 'spend-legacy-evt', feature: 'interview_standard' }]);
              }
              return Promise.resolve([]);
            },
          }),
        }),
        where: () => {
          const n = tableName(t);
          if (n === 'interview_sessions') {
            return {
              limit: () =>
                Promise.resolve([
                  { userId: 'user-row-id', status: 'in_progress', score: null as number | null },
                ]),
            };
          }
          if (n === 'interview_answers') {
            return Promise.resolve([{ feedback: { score: 70 } }]);
          }
          return {
            limit: () => Promise.resolve([]),
          };
        },
      }),
    }),
  },
}));

vi.mock('../../../lib/clerk.js', () => ({
  authenticateRequest: async () => null,
  getOrCreateAppUser: async (clerkUserId: string) => ({
    id: 'user-row-id',
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

vi.mock('../../../services/interview.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../services/interview.js')>();
  return {
    ...mod,
    buildInterviewQuestions: (...args: unknown[]) => {
      if (buildQuestionsThrow.on) throw new Error('simulated_question_build_failed');
      return mod.buildInterviewQuestions(...(args as Parameters<typeof mod.buildInterviewQuestions>));
    },
  };
});

import { router } from '../../trpc.js';
import { interviewRouter } from '../interview.router.js';

const testApp = router({ interview: interviewRouter });

const ctxUser = {
  req: {} as never,
  res: {} as never,
  auth: { clerkUserId: 'clerk_iv_legacy', sessionId: null },
  user: { id: 'user-row-id', clerkId: 'clerk_iv_legacy', email: 'iv@test.local' },
};

describe('legacy interview.router billing (hermetic)', () => {
  beforeEach(() => {
    approveSpendMock.mockReset();
    commitSpendMock.mockReset();
    rejectSpendMock.mockReset();
    deleteWhereMock.mockReset();
    insertValuesMock.mockReset();
    updateWhereMock.mockReset();
    buildQuestionsThrow.on = false;
    approveSpendMock.mockResolvedValue({
      spendEventId: 'spend-legacy-evt',
      feature: 'interview_standard',
      kind: 'estimated',
      approvedMaxCost: 14,
      estimatedCost: 8,
      balances: {},
    });
    commitSpendMock.mockResolvedValue({ spendEventId: 'spend-legacy-evt', actualCost: 8, balances: {} });
    rejectSpendMock.mockResolvedValue({ spendEventId: 'spend-legacy-evt' });
  });

  it('startSession calls approveSpend with interview_standard for behavioral mode', async () => {
    const caller = testApp.createCaller(ctxUser);
    const out = await caller.interview.startSession({
      mode: 'behavioral',
      difficulty: 'standard',
      questionCount: 3,
    });
    expect(out.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(out.questions).toHaveLength(3);
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_iv_legacy',
        feature: 'interview_standard',
        referenceId: out.sessionId,
      }),
    );
    expect(rejectSpendMock).not.toHaveBeenCalled();
    expect(commitSpendMock).not.toHaveBeenCalled();
  });

  it('startSession calls approveSpend with interview_deep for case-study mode', async () => {
    const caller = testApp.createCaller(ctxUser);
    const out = await caller.interview.startSession({
      mode: 'case-study',
      difficulty: 'senior',
      questionCount: 2,
    });
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'interview_deep',
        referenceId: out.sessionId,
      }),
    );
  });

  it('startSession deletes session when approveSpend fails (INSUFFICIENT_FUNDS)', async () => {
    approveSpendMock.mockRejectedValueOnce(new BillingErrorMock('INSUFFICIENT_FUNDS', 'no credits'));
    const caller = testApp.createCaller(ctxUser);
    await expect(
      caller.interview.startSession({
        mode: 'general',
        difficulty: 'standard',
        questionCount: 2,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(deleteWhereMock).toHaveBeenCalled();
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });

  it('startSession calls rejectSpend then deletes session when buildInterviewQuestions fails after approve', async () => {
    buildQuestionsThrow.on = true;
    const caller = testApp.createCaller(ctxUser);
    await expect(
      caller.interview.startSession({
        mode: 'hr',
        difficulty: 'stretch',
        questionCount: 1,
      }),
    ).rejects.toThrow('simulated_question_build_failed');
    expect(rejectSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_iv_legacy',
        spendEventId: 'spend-legacy-evt',
        reason: 'legacy_interview_start_post_approve_failed',
      }),
    );
    expect(deleteWhereMock).toHaveBeenCalled();
  });

  it('completeSession calls commitSpend with minCost for interview_standard then updates session', async () => {
    const caller = testApp.createCaller(ctxUser);
    const score = await caller.interview.completeSession({ sessionId: '00000000-0000-4000-8000-000000000001' });
    expect(score.status).toBe('completed');
    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkId: 'clerk_iv_legacy',
        spendEventId: 'spend-legacy-evt',
        actualCost: 8,
        notes: 'Legacy interview session completed',
      }),
    );
    expect(updateWhereMock).toHaveBeenCalled();
  });

  it('proves drizzle table symbols used by router match mock routing', () => {
    expect(tableName(interviewSessions)).toBe('interview_sessions');
    expect(tableName(interviewAnswers)).toBe('interview_answers');
    expect(tableName(creditSpendEvents)).toBe('credit_spend_events');
    expect(tableName(users)).toBe('users');
  });
});
