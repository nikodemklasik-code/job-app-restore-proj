import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Produkcja: .env w katalogu głównym repo (np. /var/www/multivohub-jobapp/.env), cwd = backend/dist
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/routers/index.js';
import { runRetentionJob } from './services/retentionJob.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled — frontend is separate

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// TODO: apply aiLimiter to /api/assistant/* when AI streaming routes are added
// const aiLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 min
//   max: 10,
//   message: { error: 'AI rate limit exceeded. Please wait.' },
// });

app.use(generalLimiter);
const port = parseInt(process.env.PORT ?? '3001', 10);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Stripe webhook — MUST be before express.json()
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).send('Missing signature or webhook secret');
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-02-24.acacia' });
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    const { db } = await import('./db/index.js');
    const { subscriptions } = await import('./db/schema.js');
    const { eq } = await import('drizzle-orm');

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === 'active' ? 'active' : 'cancelled';
      await db.update(subscriptions)
        .set({ status, updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      console.log(`[Stripe Webhook] ${event.type}: subscription ${sub.id} → ${status}`);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (subId) {
        await db.update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, subId));
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
  }

  res.json({ received: true });
});

app.use(express.json());

app.use('/trpc', createExpressMiddleware({ router: appRouter }));

const apiRouter = express.Router();
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    scope: 'api',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`tRPC available at http://localhost:${port}/trpc`);
  console.log(`REST prefix /api (e.g. health at /api/health)`);
});

// Run retention job daily (24h interval)
setInterval(() => { void runRetentionJob(); }, 24 * 60 * 60 * 1000);
// Also run once on startup after 30s (give DB time to connect)
setTimeout(() => { void runRetentionJob(); }, 30_000);
