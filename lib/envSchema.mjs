/**
 * ENV Schema Validation
 *
 * Usage (fail-fast at process startup):
 *   import { requireValidEnv } from '../../lib/envSchema.mjs';
 *   requireValidEnv();
 *
 * Or standalone: node lib/envSchema.mjs
 *
 * Tests: node --test lib/envSchema.test.mjs
 */

// ─── Schema definition ────────────────────────────────────────────────────────

/** @type {Record<string, { required: boolean; pattern?: RegExp; description: string }>} */
const ENV_SCHEMA = {
  // Database
  DATABASE_URL: {
    required: true,
    pattern: /^mysql:\/\/.+/,
    description: 'MySQL connection string — must start with mysql://',
  },

  // Clerk Auth
  CLERK_SECRET_KEY: {
    required: true,
    pattern: /^sk_(test|live)_/,
    description: 'Clerk secret key — must start with sk_test_ or sk_live_',
  },

  // OpenAI
  OPENAI_API_KEY: {
    required: true,
    pattern: /^sk-/,
    description: 'OpenAI API key — must start with sk-',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    required: true,
    pattern: /^sk_(test|live)_/,
    description: 'Stripe secret key — must start with sk_test_ or sk_live_',
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    pattern: /^whsec_/,
    description: 'Stripe webhook signing secret — must start with whsec_',
  },

  // Security
  ENCRYPTION_KEY: {
    required: true,
    pattern: /^.{32,}$/,
    description: 'Encryption key — minimum 32 characters',
  },

  // App config
  PORT: {
    required: false,
    pattern: /^\d+$/,
    description: 'Server port number (default 3001)',
  },
  NODE_ENV: {
    required: false,
    pattern: /^(development|production|test)$/,
    description: 'Node environment — development | production | test',
  },
  FRONTEND_URL: {
    required: false,
    pattern: /^https?:\/\/.+/,
    description: 'Frontend URL for CORS (default http://localhost:5173)',
  },
};

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Validates process.env against ENV_SCHEMA.
 * @param {{ strict?: boolean }} [opts]
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateEnv(opts = {}) {
  const { strict = false } = opts;
  const errors = [];

  for (const [key, rule] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];

    if (rule.required && !value) {
      errors.push(`Missing required env var ${key}: ${rule.description}`);
      if (strict) break;
      continue;
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push(`Invalid value for ${key}: ${rule.description}`);
      if (strict) break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calls validateEnv and exits if validation fails.
 * Designed to be called once at server startup.
 */
export function requireValidEnv() {
  const { valid, errors } = validateEnv();
  if (!valid) {
    console.error('\n[envSchema] ❌ Invalid environment configuration:\n');
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    console.error('\nFix the above issues in your .env file and restart.\n');
    process.exit(1);
  }
}

// ─── Standalone run ───────────────────────────────────────────────────────────

const isMain = process.argv[1]?.endsWith('envSchema.mjs');
if (isMain) {
  const dotenv = await import('dotenv');
  dotenv.default.config();
  const { valid, errors } = validateEnv();
  if (valid) {
    console.log('✅ All required environment variables are set and valid.');
  } else {
    console.error('❌ Environment validation failed:');
    for (const err of errors) console.error(`  • ${err}`);
    process.exit(1);
  }
}
