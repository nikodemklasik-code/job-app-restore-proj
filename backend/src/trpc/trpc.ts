import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';
import {
  authenticateRequest,
  getOrCreateAppUser,
  type AuthenticatedAppUser,
  type BackendAuth,
} from '../lib/clerk.js';
import type { FeatureKey } from '../services/creditsConfig.js';

/** Populated by `requireSpendApproval` after a successful `approveSpend`. */
export interface SpendReservation {
  spendEventId: string;
  kind: 'fixed' | 'estimated';
  feature: FeatureKey;
  approvedMaxCost: number;
}

export interface TrpcContext {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  auth: BackendAuth | null;
  user: AuthenticatedAppUser | null;
  spendReservation?: SpendReservation;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TrpcContext> {
  const auth = await authenticateRequest(req);
  const user = auth ? await getOrCreateAppUser(auth.clerkUserId) : null;
  return { req, res, auth, user };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth,
      user: ctx.user,
    },
  });
});
