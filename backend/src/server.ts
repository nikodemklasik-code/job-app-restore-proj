import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';
import OpenAI from 'openai';
import multer from 'multer';
import { streamInterviewResponse } from './services/interviewConversation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Try multiple levels up to find .env — handles both old (dist/server.js) and new (dist/backend/src/server.js) layouts
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // dist/backend/src/ → repo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });        // dist/ → repo root (legacy)
dotenv.config({ path: path.resolve(__dirname, '../.env') });            // local dev fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/routers/index.js';
import { createContext } from './trpc/trpc.js';
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

const port = parseInt(process.env.PORT ?? '3001', 10);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook — MUST be before express.json() and before global rate limit (Stripe retries / bursts).
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
app.use(generalLimiter);

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

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

// Interview conversation SSE stream
app.post('/api/interview/stream', async (req, res) => {
  const { messages, job, userId } = req.body as {
    messages: Array<{ role: string; content: string }>;
    job: { title: string; company: string; description?: string; requirements?: string[] };
    userId?: string;
  };

  if (!messages || !job?.title || !job?.company) {
    res.status(400).json({ error: 'Missing messages or job context' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const validMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (userId) {
      // Build adaptive prompt based on candidate history
      const { buildCandidateInsights } = await import('./services/adaptiveInterviewer.js');
      const { buildAdaptiveInterviewerSystemPrompt } = await import('./services/interviewConversation.js');
      const insights = await buildCandidateInsights(userId);
      const systemPrompt = buildAdaptiveInterviewerSystemPrompt(job, insights);

      // Send insights metadata as first SSE event
      res.write(`data: ${JSON.stringify({ type: 'insights', ...insights })}\n\n`);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...validMessages],
        stream: true,
        temperature: 0.7,
        max_tokens: 200,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    } else {
      for await (const chunk of streamInterviewResponse(validMessages, job)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[Interview Stream]', err);
    res.write(`data: ${JSON.stringify({ error: 'AI stream failed' })}\n\n`);
  } finally {
    res.end();
  }
});

// TTS endpoint — converts AI text to speech
app.post('/api/interview/tts', async (req, res) => {
  const { text } = req.body as { text: string };

  if (!text || text.length > 500) {
    res.status(400).json({ error: 'Invalid text' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'TTS not configured' });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx', // Deep professional male voice
      input: text,
      speed: 0.95,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('[TTS]', err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Whisper STT — transcribe audio from browser MediaRecorder
app.post('/api/interview/transcribe', upload.single('audio'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'STT not configured' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No audio file' });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const file = new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype || 'audio/webm' });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });
    res.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[Whisper STT]', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
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
