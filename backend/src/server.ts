import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';
import multer from 'multer';
import { streamInterviewResponse } from './services/interviewConversation.js';
import { getOpenAiClient } from './lib/openai/openai.client.js';
import { getDefaultTextModel } from './lib/openai/model-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Try multiple levels up to find .env — handles both old (dist/server.js) and new (dist/backend/src/server.js) layouts
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // dist/backend/src/ → repo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });        // dist/ → repo root (legacy)
dotenv.config({ path: path.resolve(__dirname, '../.env') });            // local dev fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Fail-fast ENV validation ─────────────────────────────────────────────────
// Skip in test environment to allow partial ENV in unit tests
if (process.env.NODE_ENV !== 'test') {
  // Path resolves correctly at runtime from dist/backend/src/ → repo root
  // (compile-time path differs from runtime path due to rootDir: ".." in tsconfig)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { requireValidEnv } = await import('../../../../lib/envSchema.mjs');
  requireValidEnv();
}
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/routers/index.js';
import { createContext } from './trpc/trpc.js';
import { createJobRadarOpenApiRouter } from './modules/job-radar/api/job-radar.express.router.js';
import { runRetentionJob } from './services/retentionJob.js';
import { resolveExpressTrustProxy } from './runtime/express-trust-proxy.js';

const app = express();
app.set('trust proxy', resolveExpressTrustProxy());

app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled — frontend is separate

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Tighter limiter for AI-heavy endpoints (interview, negotiation, assistant)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait a moment and try again.' },
});

const port = parseInt(process.env.PORT ?? '3001', 10);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
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

// Job Radar OpenAPI v1.1 literal REST paths (same handlers as `jobRadar` tRPC router)
app.use('/job-radar', createJobRadarOpenApiRouter());

// Strict rate limit for AI-heavy endpoints (streaming, TTS, STT, negotiation, assistant)
app.use('/api/interview', aiLimiter);
app.use('/api/negotiation', aiLimiter);
// tRPC assistant.sendMessage — path is /trpc/assistant.sendMessage or /trpc/assistant.getHistory
app.use('/trpc/assistant.sendMessage', aiLimiter);

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
  const { messages, job, userId, mode } = req.body as {
    messages: Array<{ role: string; content: string }>;
    job: { title: string; company: string; description?: string; requirements?: string[] };
    userId?: string;
    mode?: string;
  };

  if (!messages || !job?.title || !job?.company) {
    res.status(400).json({ error: 'Missing messages or job context' });
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    res.status(503).json({
      error: 'OPENAI_NOT_CONFIGURED',
      message:
        'OPENAI_API_KEY is missing or empty. Set it in the backend environment to use the interview AI stream (see deployment docs / qc-ai-live-smoke).',
    });
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
      const systemPrompt = buildAdaptiveInterviewerSystemPrompt(job, insights, mode);

      // Send insights metadata as first SSE event
      res.write(`data: ${JSON.stringify({ type: 'insights', ...insights })}\n\n`);

      const openai = getOpenAiClient();
      const stream = await openai.chat.completions.create({
        model: getDefaultTextModel(),
        messages: [{ role: 'system', content: systemPrompt }, ...validMessages],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    } else {
      for await (const chunk of streamInterviewResponse(validMessages, job, mode)) {
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

// TTS — UK English product default via model + instructions (override with OPENAI_TTS_MODEL=tts-1 if needed)
const TTS_LEGACY_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
const TTS_MINI_EXTRA_VOICES = ['ash', 'ballad', 'coral', 'sage', 'verse', 'marin', 'cedar'] as const;
const TTS_MINI_VOICE_SET = new Set<string>([...TTS_LEGACY_VOICES, ...TTS_MINI_EXTRA_VOICES]);
const TTS_MAX_INPUT_CHARS = 4000;
const UK_TTS_INSTRUCTIONS =
  process.env.OPENAI_TTS_INSTRUCTIONS?.trim() ||
  'Speak clearly in professional British English (neutral UK workplace accent). Natural intonation; do not use American pronunciation or vocabulary choices.';

function resolveTtsVoice(requestedVoice: unknown, model: string): string {
  const v = typeof requestedVoice === 'string' ? requestedVoice.trim() : '';
  const defaultMini = (process.env.OPENAI_TTS_DEFAULT_VOICE ?? 'coral').trim() || 'coral';
  if (model.startsWith('gpt-4o')) {
    if (TTS_MINI_VOICE_SET.has(v)) return v;
    return TTS_MINI_VOICE_SET.has(defaultMini) ? defaultMini : 'coral';
  }
  if (TTS_LEGACY_VOICES.includes(v as (typeof TTS_LEGACY_VOICES)[number])) return v;
  return 'onyx';
}

app.post('/api/interview/tts', async (req, res) => {
  const { text, voice: requestedVoice } = req.body as { text?: string; voice?: string };
  const trimmed = typeof text === 'string' ? text.trim() : '';

  if (!trimmed || trimmed.length > TTS_MAX_INPUT_CHARS) {
    res.status(400).json({ error: 'Invalid text' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    res.status(503).json({
      error: 'OPENAI_NOT_CONFIGURED',
      message: 'OPENAI_API_KEY is missing or empty. TTS is unavailable until the key is set on the backend.',
    });
    return;
  }

  const ttsModel = (process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts').trim() || 'gpt-4o-mini-tts';
  const voice = resolveTtsVoice(requestedVoice, ttsModel);

  try {
    const openai = getOpenAiClient();
    const payload: Record<string, unknown> = {
      model: ttsModel,
      voice,
      input: trimmed,
      speed: 0.95,
    };
    if (ttsModel.startsWith('gpt-4o')) {
      payload.instructions = UK_TTS_INSTRUCTIONS;
    }
    const mp3 = await openai.audio.speech.create(payload as unknown as Parameters<typeof openai.audio.speech.create>[0]);

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
  if (!apiKey?.trim()) {
    res.status(503).json({
      error: 'OPENAI_NOT_CONFIGURED',
      message: 'OPENAI_API_KEY is missing or empty. Speech-to-text is unavailable until the key is set on the backend.',
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No audio file' });
    return;
  }

  try {
    const openai = getOpenAiClient();
    const file = new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype || 'audio/webm' });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      prompt: 'British English. UK workplace and interview vocabulary.',
    });
    res.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[Whisper STT]', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// ─── Negotiation coaching stream ──────────────────────────────────────────────
app.post('/api/negotiation/stream', async (req, res) => {
  const { messages } = req.body as {
    messages: Array<{ role: string; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing messages' });
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    res.status(503).json({
      error: 'OPENAI_NOT_CONFIGURED',
      message:
        'OPENAI_API_KEY is missing or empty. Set it in the backend environment to use the negotiation AI stream.',
    });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const { streamNegotiationResponse } = await import('./services/negotiationConversation.js');
    const validMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    for await (const chunk of streamNegotiationResponse(validMessages)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[Negotiation Stream]', err);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
  } finally {
    res.end();
  }
});

app.post('/api/negotiation/simulate', async (req, res) => {
  const { messages, offer } = req.body as {
    messages: Array<{ role: string; content: string }>;
    offer: { role: string; company: string; offeredSalary: number; currency: string; targetSalary: number; marketRate?: number; benefits?: string };
  };

  if (!messages || !Array.isArray(messages) || !offer) {
    res.status(400).json({ error: 'Missing messages or offer' });
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    res.status(503).json({
      error: 'OPENAI_NOT_CONFIGURED',
      message:
        'OPENAI_API_KEY is missing or empty. Set it in the backend environment to use the negotiation simulation stream.',
    });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const { streamNegotiationSimulation } = await import('./services/negotiationConversation.js');
    const validMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    for await (const chunk of streamNegotiationSimulation(validMessages, offer)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[Negotiation Simulate]', err);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
  } finally {
    res.end();
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
