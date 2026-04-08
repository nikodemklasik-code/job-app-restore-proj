import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/routers/index.js';

const app = express();
const port = parseInt(process.env.PORT ?? '3001', 10);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json());

app.use('/trpc', createExpressMiddleware({ router: appRouter }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`tRPC available at http://localhost:${port}/trpc`);
});
