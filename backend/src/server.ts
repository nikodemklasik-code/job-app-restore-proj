import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Produkcja: .env w katalogu głównym repo (np. /var/www/multivohub-jobapp/.env), cwd = backend/dist
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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
