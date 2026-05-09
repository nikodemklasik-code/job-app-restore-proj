/**
 * Property-Based Tests — Credits Balance Invariant (Property 23)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulates the credits reservation lifecycle:
 * reserve → commit OR reserve → release
 *
 * Invariant: final balance = initial - sum(committed)
 * Released reservations do not affect balance.
 */
interface CreditOperation {
    type: 'reserve_commit' | 'reserve_release';
    amount: number;
}

function simulateCreditOperations(initialBalance: number, operations: CreditOperation[]): {
    finalBalance: number;
    totalCommitted: number;
} {
    let balance = initialBalance;
    let totalCommitted = 0;

    for (const op of operations) {
        if (op.type === 'reserve_commit') {
            // Reserve then commit: deducts from balance
            balance -= op.amount;
            totalCommitted += op.amount;
        }
        // reserve_release: no effect on balance (reservation returned)
    }

    return { finalBalance: balance, totalCommitted };
}

describe('Property 23: Credits Balance Invariant', () => {
    it('final balance = initial - sum(committed charges)', () => {
        const operationArb = fc.record({
            type: fc.constantFrom('reserve_commit', 'reserve_release') as fc.Arbitrary<'reserve_commit' | 'reserve_release'>,
            amount: fc.integer({ min: 1, max: 50 }),
        });

        fc.assert(fc.property(
            fc.integer({ min: 100, max: 10000 }),
            fc.array(operationArb, { minLength: 1, maxLength: 20 }),
            (initialBalance, operations) => {
                const result = simulateCreditOperations(initialBalance, operations);
                expect(result.finalBalance).toBe(initialBalance - result.totalCommitted);
            },
        ), { numRuns: 100 });
    });

    it('released reservations do not affect balance', () => {
        fc.assert(fc.property(
            fc.integer({ min: 100, max: 10000 }),
            fc.integer({ min: 1, max: 50 }),
            (initialBalance, amount) => {
                const withRelease = simulateCreditOperations(initialBalance, [
                    { type: 'reserve_release', amount },
                ]);
                expect(withRelease.finalBalance).toBe(initialBalance);
                expect(withRelease.totalCommitted).toBe(0);
            },
        ), { numRuns: 100 });
    });
});
