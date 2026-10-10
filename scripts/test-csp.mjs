import fs from 'node:fs';
import path from 'node:path';

const middleware = fs.readFileSync(path.join(process.cwd(), 'middleware.ts'), 'utf8');
const csp = fs.readFileSync(path.join(process.cwd(), 'lib/security/csp.ts'), 'utf8');
const layout = fs.readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8');

if (!middleware.includes('applyDocumentSecurityHeaders')) {
  console.error('middleware must apply document CSP headers');
  process.exit(1);
}
if (/unsafe-eval/.test(csp) && !csp.includes('development')) {
  console.error('csp.ts: unsafe-eval must only be enabled for development (Next react-refresh)');
  process.exit(1);
}
if (!csp.includes('unsafe-eval') || !csp.includes('development')) {
  console.error('csp.ts must allow unsafe-eval only when development is true');
  process.exit(1);
}
if (!layout.includes('getDocumentScriptNonce') || !layout.includes('scriptNonceProps')) {
  console.error('layout must use production-only script nonces via request-nonce');
  process.exit(1);
}
if (!fs.readFileSync(path.join(process.cwd(), 'lib/security/middleware-headers.ts'), 'utf8').includes('NODE_ENV === \'development\'')) {
  console.error('middleware-headers must skip CSP in development');
  process.exit(1);
}
console.log('OK: CSP middleware + layout nonce');
