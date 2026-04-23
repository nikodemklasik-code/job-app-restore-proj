export type JsonParseErrorCode = 'EMPTY_BODY' | 'HTML_RESPONSE' | 'UNSUPPORTED_CONTENT_TYPE' | 'INVALID_JSON';

export class JsonResponseParseError extends Error {
  readonly code: JsonParseErrorCode;
  readonly status: number;
  readonly contentType: string;
  readonly bodyPreview: string;

  constructor(params: { code: JsonParseErrorCode; message: string; status: number; contentType: string; bodyPreview?: string }) {
    super(params.message);
    this.name = 'JsonResponseParseError';
    this.code = params.code;
    this.status = params.status;
    this.contentType = params.contentType;
    this.bodyPreview = params.bodyPreview ?? '';
  }
}

const htmlLikePrefix = (raw: string): boolean => {
  const trimmed = raw.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
};

const buildPreview = (raw: string): string => raw.trim().slice(0, 180);

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  const preview = buildPreview(raw);

  if (!raw.trim()) {
    throw new JsonResponseParseError({
      code: 'EMPTY_BODY',
      message: 'Response body is empty.',
      status: response.status,
      contentType,
      bodyPreview: preview,
    });
  }

  if (contentType.includes('text/html') || htmlLikePrefix(raw)) {
    throw new JsonResponseParseError({
      code: 'HTML_RESPONSE',
      message: 'Server returned HTML instead of JSON.',
      status: response.status,
      contentType,
      bodyPreview: preview,
    });
  }

  const likelyJson = contentType.includes('application/json') || contentType.includes('+json') || raw.trim().startsWith('{') || raw.trim().startsWith('[');
  if (!likelyJson) {
    throw new JsonResponseParseError({
      code: 'UNSUPPORTED_CONTENT_TYPE',
      message: 'Response content type is not JSON.',
      status: response.status,
      contentType,
      bodyPreview: preview,
    });
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new JsonResponseParseError({
      code: 'INVALID_JSON',
      message: 'Response body is not valid JSON.',
      status: response.status,
      contentType,
      bodyPreview: preview,
    });
  }
}
