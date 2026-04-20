/**
 * Hermetic dashboard helpers — no live MySQL.
 */
import { describe, expect, it } from 'vitest';
import { mapApplicationStatusToDashboard } from '../dashboard-snapshot.mapper.js';

describe('mapApplicationStatusToDashboard', () => {
  it.each([
    ['draft', 'draft'],
    ['prepared', 'saved'],
    ['sent', 'applied'],
    ['follow_up_sent', 'applied'],
    ['interview', 'interview'],
    ['accepted', 'offer'],
    ['rejected', 'rejected'],
    ['archived', 'archived'],
    ['unknown_status', 'saved'],
    [null, 'draft'],
  ] as const)('maps %s -> %s', (raw, expected) => {
    expect(mapApplicationStatusToDashboard(raw)).toBe(expected);
  });
});
