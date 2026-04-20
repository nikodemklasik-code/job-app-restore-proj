import { describe, it, expect, afterEach } from 'vitest';
import {
  getDefaultTextModel,
  getLegalDeepModel,
  getLegalSearchModel,
  getPremiumTextModel,
  getRealtimeModelId,
  getRoutingModel,
} from '../model-registry.js';

const snapshot = { ...process.env };

afterEach(() => {
  process.env = { ...snapshot };
});

describe('model-registry', () => {
  it('uses legacy OPENAI_MODEL for default and routing when specific vars unset', () => {
    delete process.env.OPENAI_DEFAULT_MODEL;
    delete process.env.OPENAI_ROUTING_MODEL;
    delete process.env.OPENAI_MODEL;
    expect(getDefaultTextModel()).toBe('gpt-5.4-mini');
    expect(getRoutingModel()).toBe('gpt-5.4-nano');
  });

  it('respects OPENAI_MODEL for default and routing', () => {
    delete process.env.OPENAI_DEFAULT_MODEL;
    delete process.env.OPENAI_ROUTING_MODEL;
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
    expect(getDefaultTextModel()).toBe('gpt-4o-mini');
    expect(getRoutingModel()).toBe('gpt-4o-mini');
  });

  it('prefers OPENAI_DEFAULT_MODEL over OPENAI_MODEL', () => {
    process.env.OPENAI_MODEL = 'legacy';
    process.env.OPENAI_DEFAULT_MODEL = 'gpt-5.4';
    expect(getDefaultTextModel()).toBe('gpt-5.4');
  });

  it('returns spec defaults for premium, legal, realtime', () => {
    delete process.env.OPENAI_PREMIUM_MODEL;
    delete process.env.OPENAI_LEGAL_SEARCH_MODEL;
    delete process.env.OPENAI_LEGAL_DEEP_MODEL;
    delete process.env.OPENAI_REALTIME_MODEL;
    expect(getPremiumTextModel()).toBe('gpt-5.4');
    expect(getLegalSearchModel()).toBe('gpt-5.4-mini');
    expect(getLegalDeepModel()).toBe('gpt-5.4');
    expect(getRealtimeModelId()).toBe('gpt-realtime-mini');
  });
});
