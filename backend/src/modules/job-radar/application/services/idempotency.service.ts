/**
 * Compares JSON-like payloads for idempotent replay. Uses structural equality with
 * object keys compared in sorted order so MySQL JSON round-trips (which may reorder
 * object keys) do not cause false mismatches vs `JSON.stringify` byte equality.
 */
export class IdempotencyService {
  payloadMatches(existingPayload: Record<string, unknown>, incomingPayload: Record<string, unknown>): boolean {
    return deepJsonSemanticEqual(existingPayload, incomingPayload);
  }
}

function deepJsonSemanticEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return a === b;

  const ta = typeof a;
  const tb = typeof b;
  if (ta !== tb) return false;

  if (ta !== 'object') return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepJsonSemanticEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
  }
  for (const k of aKeys) {
    if (!deepJsonSemanticEqual(aObj[k], bObj[k])) return false;
  }
  return true;
}
