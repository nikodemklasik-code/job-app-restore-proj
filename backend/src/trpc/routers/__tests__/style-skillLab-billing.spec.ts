/**
 * Hermetic billing tests for Style document analysis + Skill Lab gap / course suggest — no MySQL, no appRouter.
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
import { skillLabRouter } from '../skillLab.router.js';
import { styleRouter } from '../style.router.js';

const testApp = router({ skillLab: skillLabRouter, style: styleRouter });

const ctxUser = {
  req: {} as never,
  res: {} as never,
  auth: { clerkUserId: 'clerk_style_lab', sessionId: null },
  user: { id: 'user-row-id', clerkId: 'clerk_style_lab', email: 'style@test.local' },
};

describe('style + skillLab spend (hermetic, no OpenAI)', () => {
  beforeEach(() => {
    approveSpendMock.mockReset();
    commitSpendMock.mockReset();
    rejectSpendMock.mockReset();
    approveSpendMock.mockImplementation(async (input: { feature: string }) => ({
      spendEventId: `spend-${input.feature}`,
      feature: input.feature,
      kind: 'estimated',
      approvedMaxCost: 10,
      estimatedCost: 10,
      balances: {
        plan: 'free',
        credits: 10,
        allowance: { limit: 50, remaining: 40, periodStart: null, periodEnd: null },
        spendableTotal: 50,
        usedThisMonth: { fromAllowance: 0, fromCredits: 0, total: 0 },
      },
    }));
    commitSpendMock.mockResolvedValue({ spendEventId: 'x', actualCost: 6, balances: {} });
    rejectSpendMock.mockResolvedValue({ spendEventId: 'x' });
  });

  it('style.analyzeDocument approves style_analyze_document then commitSpend', async () => {
    const caller = testApp.createCaller(ctxUser);
    const out = await caller.style.analyzeDocument({
      text: 'Led a team of five shipping payroll integrations.',
      documentType: 'cv',
    });
    expect(out.score).toBe(65);
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'style_analyze_document', clerkId: 'clerk_style_lab' }),
    );
    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ spendEventId: 'spend-style_analyze_document' }),
    );
    expect(rejectSpendMock).not.toHaveBeenCalled();
  });

  it('skillLab.analyzeJobGap approves skill_lab_gap_analysis then commitSpend', async () => {
    const caller = testApp.createCaller(ctxUser);
    const out = await caller.skillLab.analyzeJobGap({
      text: 'We need strong TypeScript and system design skills.',
    });
    expect(out.score).toBe(65);
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'skill_lab_gap_analysis', clerkId: 'clerk_style_lab' }),
    );
    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ spendEventId: 'spend-skill_lab_gap_analysis' }),
    );
  });

  it('style.suggestCoursesForSkill approves skill_lab_course_suggest then commitSpend', async () => {
    const caller = testApp.createCaller(ctxUser);
    const out = await caller.style.suggestCoursesForSkill({ skill: 'Rust' });
    expect(out.courses.length).toBeGreaterThan(0);
    expect(approveSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'skill_lab_course_suggest', clerkId: 'clerk_style_lab' }),
    );
    expect(commitSpendMock).toHaveBeenCalledWith(
      expect.objectContaining({ spendEventId: 'spend-skill_lab_course_suggest' }),
    );
  });

  it('does not commit when approveSpend fails with INSUFFICIENT_FUNDS (style_analyze_document)', async () => {
    approveSpendMock.mockRejectedValueOnce(new BillingErrorMock('INSUFFICIENT_FUNDS', 'Not enough credits'));
    const caller = testApp.createCaller(ctxUser);
    await expect(
      caller.style.analyzeDocument({ text: 'Short CV text for billing gate.', documentType: 'cv' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(commitSpendMock).not.toHaveBeenCalled();
  });
});
