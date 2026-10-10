import { headers } from 'next/headers';
import { CSP_NONCE_HEADER } from '@/lib/security/middleware-headers';

/** CSP nonces on <script> are production-only (Next dev hydrates nonce from CSP without RSC header). */
export function getDocumentScriptNonce(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  const raw = headers().get(CSP_NONCE_HEADER);
  return raw && raw.length > 0 ? raw : undefined;
}

export function scriptNonceProps(nonce: string | undefined): { nonce?: string } {
  return nonce ? { nonce } : {};
}
