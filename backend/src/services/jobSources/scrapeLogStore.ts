interface ScrapeEvent {
  ts: Date;
  provider: string;
  query: string;
  count: number;
  error?: string;
}

const BUFFER_SIZE = 100;
const _log: ScrapeEvent[] = [];

export function logScrape(event: ScrapeEvent): void {
  _log.push(event);
  if (_log.length > BUFFER_SIZE) {
    _log.shift();
  }
}

export function getRecentLogs(n = 20): ScrapeEvent[] {
  return _log.slice(-n);
}
