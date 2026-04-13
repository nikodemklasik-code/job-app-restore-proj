/**
 * Type declarations for lib/envSchema.mjs
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidateEnvOptions {
  strict?: boolean;
}

/**
 * Validates process.env against ENV_SCHEMA.
 */
export declare function validateEnv(opts?: ValidateEnvOptions): EnvValidationResult;

/**
 * Calls validateEnv and exits process if validation fails.
 * Designed to be called once at server startup.
 */
export declare function requireValidEnv(): void;
