import type { CollectorInput, CollectorResult, JobRadarCollector } from './job-radar.collector.js';

export class OfficialSiteCollector implements JobRadarCollector {
  readonly sourceType = 'official_website';
  readonly sourceQualityTier = 1 as const;

  canHandle(input: CollectorInput): boolean {
    return Boolean(input.sourceUrl);
  }

  async collect(input: CollectorInput): Promise<CollectorResult> {
    if (!input.sourceUrl) {
      return {
        status: 'failed',
        sourceUrl: '',
        errorCode: 'MISSING_SOURCE_URL',
        errorMessage: 'sourceUrl is required',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const response = await fetch(input.sourceUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'JobRadarBot/1.1',
        },
      });

      if (response.status === 403 || response.status === 401) {
        return {
          status: 'blocked',
          sourceUrl: input.sourceUrl,
          blockReason: `Access blocked with status ${response.status}`,
        };
      }

      if (!response.ok) {
        return {
          status: 'failed',
          sourceUrl: input.sourceUrl,
          errorCode: 'HTTP_ERROR',
          errorMessage: `Unexpected status ${response.status}`,
        };
      }

      const rawContent = await response.text();
      const normalizedUrl = response.url;

      const titleMatch = rawContent.match(/<title>(.*?)<\/title>/i);

      return {
        status: 'done',
        sourceUrl: input.sourceUrl,
        normalizedUrl,
        title: titleMatch?.[1]?.trim() ?? undefined,
        rawContent,
        metadata: {
          final_url: normalizedUrl,
          content_type: response.headers.get('content-type'),
        },
      };
    } catch (error) {
      const isAbort =
        error instanceof Error &&
        (error.name === 'AbortError' || (error as { code?: string }).code === 'ABORT_ERR');
      return {
        status: 'failed',
        sourceUrl: input.sourceUrl,
        errorCode: isAbort ? 'TIMEOUT' : 'FETCH_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
