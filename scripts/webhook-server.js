#!/usr/bin/env node
/**
 * Deploy Webhook Server — multivohub-jobapp
 *
 * Runs on the VPS. Accepts an authenticated POST request and triggers
 * a git-pull-based deploy without needing SSH access from the caller.
 *
 * Usage:
 *   DEPLOY_TOKEN=mysecret node scripts/webhook-server.js
 *
 * Trigger a deploy from anywhere (local machine, CI, Slack bot, etc.):
 *   curl -X POST "https://jobapp.multivohub.com/webhook/deploy?token=mysecret"
 *   # or via the helper script:
 *   bash scripts/trigger-deploy.sh mysecret
 *
 * Environment variables:
 *   DEPLOY_TOKEN      Required. Secret token that must match the ?token= query param.
 *   WEBHOOK_PORT      Port to listen on (default: 9000).
 *   APP_DIR           Absolute path to the app on the VPS (default: /var/www/multivohub-jobapp).
 *   BRANCH            Git branch to pull (default: main).
 *   PM2_APP_NAME      PM2 process name to reload (default: jobapp-server).
 *
 * PM2 setup (add to ecosystem.config.cjs):
 *   See infra/ecosystem.config.cjs — the 'jobapp-webhook' app entry runs this file.
 *
 * Security notes:
 *   - Use HTTPS (via Nginx reverse-proxy) in production so the token isn't sent
 *     in plain text. Example Nginx snippet:
 *       location /webhook/ { proxy_pass http://127.0.0.1:9000/; }
 *   - Token is compared with a constant-time comparison to prevent timing attacks.
 *   - Only one deploy can run at a time (lock flag).
 */

import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

// ─── Config ──────────────────────────────────────────────────────────────────
const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN ?? '';
const PORT = parseInt(process.env.WEBHOOK_PORT ?? '9000', 10);
const APP_DIR = process.env.APP_DIR ?? '/var/www/multivohub-jobapp';
const BRANCH = process.env.BRANCH ?? 'main';
const PM2_APP = process.env.PM2_APP_NAME ?? 'jobapp-server';

if (!DEPLOY_TOKEN) {
  console.error('❌  DEPLOY_TOKEN env var is required.');
  process.exit(1);
}

// ─── State ───────────────────────────────────────────────────────────────────
let deploying = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeEqual(a, b) {
  // Constant-time string comparison to prevent timing attacks
  const bufA = Buffer.from(createHash('sha256').update(a).digest('hex'));
  const bufB = Buffer.from(createHash('sha256').update(b).digest('hex'));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function runDeploy() {
  const steps = [
    ['git', ['-C', APP_DIR, 'fetch', 'origin', BRANCH]],
    ['git', ['-C', APP_DIR, 'reset', '--hard', `origin/${BRANCH}`]],
    ['npm', ['ci', '--omit=dev', '--prefix', path.join(APP_DIR, 'backend')]],
    ['pm2', ['reload', path.join(APP_DIR, 'infra/ecosystem.config.cjs'), '--update-env']],
    ['pm2', ['save']],
  ];

  for (const [cmd, args] of steps) {
    log(`  ▶ ${cmd} ${args.join(' ')}`);
    const { stdout, stderr } = await execFileAsync(cmd, args, { cwd: APP_DIR, timeout: 120_000 });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }
}

// ─── HTTP server ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check (unauthenticated)
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', deploying }));
    return;
  }

  // Deploy endpoint
  if (req.method === 'POST' && url.pathname === '/deploy') {
    const token = url.searchParams.get('token') ?? '';

    if (!safeEqual(token, DEPLOY_TOKEN)) {
      log(`⛔ Unauthorized deploy attempt from ${req.socket.remoteAddress}`);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    if (deploying) {
      log('⚠️  Deploy already in progress — rejecting duplicate request');
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Deploy already in progress' }));
      return;
    }

    log(`🚀 Deploy triggered by ${req.socket.remoteAddress}`);
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Deploy started', branch: BRANCH }));

    deploying = true;
    runDeploy()
      .then(() => {
        log('✅ Deploy complete');
      })
      .catch((err) => {
        log(`❌ Deploy failed: ${err.message}`);
        console.error(err);
      })
      .finally(() => {
        deploying = false;
      });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  log(`Webhook server listening on 127.0.0.1:${PORT}`);
  log(`Deploy endpoint: POST http://127.0.0.1:${PORT}/deploy?token=<DEPLOY_TOKEN>`);
  log(`App dir: ${APP_DIR} | Branch: ${BRANCH} | PM2 app: ${PM2_APP}`);
});

process.on('SIGTERM', () => {
  log('SIGTERM received — shutting down');
  server.close(() => process.exit(0));
});
