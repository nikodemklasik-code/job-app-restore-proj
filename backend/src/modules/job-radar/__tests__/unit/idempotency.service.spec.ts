import { describe, it, expect } from 'vitest';
import { IdempotencyService } from '../../application/services/idempotency.service.js';

describe('IdempotencyService', () => {
  const svc = new IdempotencyService();

  it('returns true when top-level keys differ only by order', () => {
    const a = { z: 1, a: 2, m: { inner: true } };
    const b = { a: 2, m: { inner: true }, z: 1 };
    expect(svc.payloadMatches(a, b)).toBe(true);
  });

  it('returns true when nested object keys differ only by order', () => {
    const a = { scanTrigger: 'manual_search', meta: { z: 1, y: 2 } };
    const b = { scanTrigger: 'manual_search', meta: { y: 2, z: 1 } };
    expect(svc.payloadMatches(a, b)).toBe(true);
  });

  it('returns false when a value differs', () => {
    const a = { x: 1, y: 2 };
    const b = { y: 2, x: 2 };
    expect(svc.payloadMatches(a, b)).toBe(false);
  });

  it('returns false when key sets differ', () => {
    const a = { x: 1 };
    const b = { x: 1, extra: true };
    expect(svc.payloadMatches(a, b)).toBe(false);
  });

  it('compares arrays by element order and structure', () => {
    const a = { items: [{ id: 1 }, { id: 2 }] };
    const b = { items: [{ id: 1 }, { id: 2 }] };
    expect(svc.payloadMatches(a, b)).toBe(true);
    expect(svc.payloadMatches({ items: [{ id: 2 }, { id: 1 }] }, { items: [{ id: 1 }, { id: 2 }] })).toBe(false);
  });
});
