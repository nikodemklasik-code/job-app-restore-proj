/**
 * Central model IDs — env overrides, legacy OPENAI_MODEL supported for default/routing.
 * Defaults follow docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */

function trimEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

const LEGACY = () => trimEnv('OPENAI_MODEL');

/** Default / routing text (chat) */
export function getDefaultTextModel(): string {
  return trimEnv('OPENAI_DEFAULT_MODEL') ?? LEGACY() ?? 'gpt-5.4-mini';
}

export function getPremiumTextModel(): string {
  return trimEnv('OPENAI_PREMIUM_MODEL') ?? 'gpt-5.4';
}

export function getRoutingModel(): string {
  return trimEnv('OPENAI_ROUTING_MODEL') ?? LEGACY() ?? 'gpt-5.4-nano';
}

export function getRealtimeModelId(): string {
  return trimEnv('OPENAI_REALTIME_MODEL') ?? 'gpt-realtime-mini';
}

export function getLegalSearchModel(): string {
  return trimEnv('OPENAI_LEGAL_SEARCH_MODEL') ?? 'gpt-5.4-mini';
}

export function getLegalDeepModel(): string {
  return trimEnv('OPENAI_LEGAL_DEEP_MODEL') ?? 'gpt-5.4';
}

/** Object snapshot for logging/meta (no secrets). */
export function getModelRegistrySnapshot() {
  return {
    defaultText: getDefaultTextModel(),
    premiumText: getPremiumTextModel(),
    routing: getRoutingModel(),
    realtime: getRealtimeModelId(),
    legalSearch: getLegalSearchModel(),
    legalDeep: getLegalDeepModel(),
  } as const;
}
