export class QuotaService {
  /** Placeholder: wire to billing / plan limits later. */
  async ensureUserCanScan(_userId: string): Promise<number> {
    return 12;
  }
}
