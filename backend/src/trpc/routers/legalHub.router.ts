import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { getLegalSearchScopeSummary, searchLegalHubSources } from '../../modules/legal-hub-search/legal-hub-search.service.js';
import { trySynthesizeLegalCatalogHits } from '../../modules/legal-hub-search/legal-hub-search.ai-synthesis.js';
import { renderLegalSearchPdfBuffer } from '../../modules/legal-hub-search/legal-hub-search.pdf.js';
import { approveSpend, BillingError } from '../../services/creditsBilling.js';
import { billingToTrpc } from './_shared.js';

export const legalHubRouter = router({
  scopeSummary: publicProcedure.query(() => getLegalSearchScopeSummary()),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().max(500).default(''),
        limit: z.number().int().min(1).max(20).optional(),
        /** When true, optionally append a short synthesis grounded ONLY in catalogue hits (requires OPENAI_API_KEY). */
        includeGroundedSummary: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const scope = getLegalSearchScopeSummary();
      const hits = searchLegalHubSources(input.query, input.limit ?? 8);
      const groundedSummary =
        input.includeGroundedSummary && hits.length > 0
          ? await trySynthesizeLegalCatalogHits(input.query, hits)
          : null;
      return {
        scope,
        hits,
        groundedSummary,
      };
    }),

  /**
   * Fixed 1-credit export of current catalogue search hits (see `legal_hub_search_pdf` in creditsConfig).
   */
  exportSearchPdf: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2).max(500),
        limit: z.number().int().min(1).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = getLegalSearchScopeSummary();
      const hits = searchLegalHubSources(input.query, input.limit ?? 12);

      let spendResult;
      try {
        spendResult = await approveSpend({
          clerkId: ctx.user.clerkId,
          feature: 'legal_hub_search_pdf',
          notes: `Legal Hub PDF: ${input.query.slice(0, 120)}`,
        });
      } catch (e) {
        if (e instanceof BillingError) billingToTrpc(e);
        throw e;
      }

      const buf = await renderLegalSearchPdfBuffer({
        query: input.query,
        hits,
        scopeLabel: scope.scopeLabel,
        generatedAtIso: new Date().toISOString(),
      });

      return {
        mimeType: 'application/pdf' as const,
        filename: `legal-hub-search-${new Date().toISOString().slice(0, 10)}.pdf`,
        base64: buf.toString('base64'),
        spendEventId: spendResult.spendEventId,
        balances: {
          plan: spendResult.balances.plan,
          credits: spendResult.balances.credits,
          allowanceRemaining: spendResult.balances.allowance.remaining,
          allowanceLimit: spendResult.balances.allowance.limit,
          spendableTotal: spendResult.balances.spendableTotal,
        },
      };
    }),

  // Compatibility alias for frontend contracts expecting `exportPdf`
  exportPdf: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2).max(500),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = getLegalSearchScopeSummary();
      const hits = searchLegalHubSources(input.query, 12);

      let spendResult;
      try {
        spendResult = await approveSpend({
          clerkId: ctx.user.clerkId,
          feature: 'legal_hub_search_pdf',
          notes: `Legal Hub PDF: ${input.query.slice(0, 120)}`,
        });
      } catch (e) {
        if (e instanceof BillingError) billingToTrpc(e);
        throw e;
      }

      const buf = await renderLegalSearchPdfBuffer({
        query: input.query,
        hits,
        scopeLabel: scope.scopeLabel,
        generatedAtIso: new Date().toISOString(),
      });

      return {
        mimeType: 'application/pdf' as const,
        filename: `legal-hub-search-${new Date().toISOString().slice(0, 10)}.pdf`,
        base64: buf.toString('base64'),
        spendEventId: spendResult.spendEventId,
      };
    }),
});
