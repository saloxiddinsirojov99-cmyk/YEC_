import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3001';
const MAX_PROXY_RETRIES = 1;
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackendUrl = (request: NextRequest) => {
  const serverBackend = process.env.BACKEND_URL?.trim();
  if (serverBackend) return serverBackend.replace(/\/+$/, '');

  const hostHeader = request.headers.get('host')?.trim();
  if (hostHeader) {
    const hostWithoutPort = hostHeader.replace(/:\d+$/, '');
    if (
      hostWithoutPort === 'localhost' ||
      hostWithoutPort === '127.0.0.1' ||
      hostWithoutPort === '::1'
    ) {
      return DEFAULT_BACKEND_URL;
    }
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${hostWithoutPort}:3001`;
  }

  const explicitBackend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (explicitBackend) return explicitBackend.replace(/\/+$/, '');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    return apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  return DEFAULT_BACKEND_URL;
};

async function proxyUploads(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backendBase = getBackendUrl(request);
  const reqUrl = new URL(request.url);
  const targetUrl = new URL(backendBase);
  const encodedPath = pathSegments
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  targetUrl.pathname = encodedPath ? `/uploads/${encodedPath}` : '/uploads';
  targetUrl.search = reqUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  const retryable = RETRYABLE_METHODS.has(method);

  for (let attempt = 0; attempt <= MAX_PROXY_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const upstream = await fetch(targetUrl.toString(), {
        method,
        headers,
        body,
        redirect: 'manual',
        signal: controller.signal,
      });

      const shouldRetry =
        retryable &&
        RETRYABLE_STATUSES.has(upstream.status) &&
        attempt < MAX_PROXY_RETRIES;

      if (shouldRetry) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.delete('content-encoding');
      responseHeaders.delete('content-length');

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (err) {
      const shouldRetry = retryable && attempt < MAX_PROXY_RETRIES;
      if (shouldRetry) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      console.error('Uploads proxy error:', err);
      return new NextResponse('Uploads service unavailable', { status: 503 });
    } finally {
      clearTimeout(timeout);
    }
  }

  return new NextResponse('Uploads service unavailable', { status: 503 });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  return proxyUploads(request, params.path ?? []);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  return proxyUploads(request, params.path ?? []);
}
