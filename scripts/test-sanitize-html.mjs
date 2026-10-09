/**
 * Regression for CMS HTML sanitizer (blog content).
 */
const FORBIDDEN_TAGS = /<\/?(?:script|iframe|object|embed|form|input|button|textarea|select|meta|link|base|style)\b[^>]*>/gi;
const EVENT_HANDLER_ATTR = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JAVASCRIPT_URL = /\s(href|src|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const DATA_URL_ATTR = /\s(src)\s*=\s*("data:[^"]*"|'data:[^']*'|data:[^\s>]+)/gi;

function sanitizeCmsHtml(raw) {
  if (raw == null || raw === '') return '';
  let html = String(raw);
  html = html.replace(FORBIDDEN_TAGS, '');
  html = html.replace(EVENT_HANDLER_ATTR, '');
  html = html.replace(JAVASCRIPT_URL, '');
  html = html.replace(DATA_URL_ATTR, '');
  return html;
}

const xss = '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
const out = sanitizeCmsHtml(xss);

if (/<script/i.test(out)) {
  console.error('FAIL: script tag survived sanitization');
  process.exit(1);
}
if (/javascript:/i.test(out)) {
  console.error('FAIL: javascript: URL survived sanitization');
  process.exit(1);
}
if (!out.includes('<p>Hi</p>')) {
  console.error('FAIL: safe markup was removed');
  process.exit(1);
}

console.log('OK: sanitize-html');
