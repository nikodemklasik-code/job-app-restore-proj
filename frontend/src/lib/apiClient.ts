import { getAuthToken } from './auth-token';
import { JsonResponseParseError, parseJsonResponse } from './parseJsonResponse';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'HTML_RESPONSE'
  | 'EMPTY_BODY'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'INVALID_JSON'
  | 'HTTP_ERROR';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(message: string, status: number, code: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const statusCodeMap: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

function mapStatusToCode(status: number): ApiErrorCode {
  if (statusCodeMap[status]) return statusCodeMap[status];
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

async function buildHeaders(init?: HeadersInit): Promise<Headers> {
  const headers = new Headers(init);
  const token = await getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  const headers = await buildHeaders(init?.headers);
  try {
    return await fetch(`${API_BASE_URL}${input}`, { ...init, headers, credentials: 'include' });
  } catch (error) {
    throw new ApiClientError('Network request failed.', 0, 'NETWORK_ERROR', error);
  }
}

async function parseError(response: Response): Promise<never> {
  try {
    const data = await parseJsonResponse<{ error?: string; message?: string; code?: string }>(response);
    const code = (data.code as ApiErrorCode | undefined) ?? mapStatusToCode(response.status);
    throw new ApiClientError(data.message ?? data.error ?? `Request failed with ${response.status}`, response.status, code, data);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof JsonResponseParseError) {
      throw new ApiClientError(error.message, response.status, error.code, {
        contentType: error.contentType,
        bodyPreview: error.bodyPreview,
      });
    }

    throw new ApiClientError(`Request failed with ${response.status}.`, response.status, mapStatusToCode(response.status), error);
  }
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, { ...init, method: init?.method ?? 'GET' });
  if (!response.ok) return parseError(response);
  return parseJsonResponse<T>(response);
}

export async function postJson<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await request(path, { ...init, method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) return parseError(response);
  return parseJsonResponse<T>(response);
}

export async function postForm<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const response = await request(path, { ...init, method: 'POST', body: formData });
  if (!response.ok) return parseError(response);
  return parseJsonResponse<T>(response);
}

export async function fetchStream(path: string, body: unknown): Promise<Response> {
  const headers = await buildHeaders({ 'Content-Type': 'application/json' });
  const response = await request(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) await parseError(response);
  return response;
}

export async function fetchBlob(path: string, body: unknown): Promise<Blob> {
  const headers = await buildHeaders({ 'Content-Type': 'application/json' });
  const response = await request(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) await parseError(response);
  return response.blob();
}
