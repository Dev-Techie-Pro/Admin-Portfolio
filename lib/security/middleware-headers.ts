import { NextRequest, NextResponse } from 'next/server';
import { buildContentSecurityPolicy, generateCspNonce } from '@/lib/security/csp';

export const CSP_NONCE_HEADER = 'x-nonce';

export function applyDocumentSecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  nonce: string,
): NextResponse {
  // Next.js dev applies CSP nonces on the client without matching RSC headers() — skip CSP locally.
  if (process.env.NODE_ENV === 'development') {
    return response;
  }
  const strictScripts = process.env.STRICT_CSP !== '0';
  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy(nonce, { strictScripts, development: false }),
  );
  return response;
}

/** Request headers forwarded to RSC (must use NextResponse.next({ request: { headers } })). */
export function requestHeadersWithNonce(request: NextRequest, nonce: string): Headers {
  const headers = new Headers(request.headers);
  headers.set(CSP_NONCE_HEADER, nonce);
  return headers;
}

export function nextWithNonceHeaders(request: NextRequest, nonce: string) {
  return { request: { headers: requestHeadersWithNonce(request, nonce) } };
}

export function createNonce(): string {
  return generateCspNonce();
}
