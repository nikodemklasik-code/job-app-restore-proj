export class IdempotencyService {
  payloadMatches(existingPayload: Record<string, unknown>, incomingPayload: Record<string, unknown>): boolean {
    return JSON.stringify(existingPayload) === JSON.stringify(incomingPayload);
  }
}
