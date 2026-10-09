/**
 * Server-side HTML sanitizer for CMS rich text (blog post body).
 * Strips active content and dangerous URLs; preserves common formatting tags.
 */

const FORBIDDEN_TAGS = /<\/?(?:script|iframe|object|embed|form|input|button|textarea|select|meta|link|base|style)\b[^>]*>/gi;
const EVENT_HANDLER_ATTR = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JAVASCRIPT_URL = /\s(href|src|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const DATA_URL_ATTR = /\s(src)\s*=\s*("data:[^"]*"|'data:[^']*'|data:[^\s>]+)/gi;

export function sanitizeCmsHtml(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '';
  let html = String(raw);
  html = html.replace(FORBIDDEN_TAGS, '');
  html = html.replace(EVENT_HANDLER_ATTR, '');
  html = html.replace(JAVASCRIPT_URL, '');
  html = html.replace(DATA_URL_ATTR, '');
  return html;
}
