'use client';

import { useLayoutEffect, useRef } from 'react';

/** Stable key so React remounts legacy markup on client-side route changes. */
export function legacyPageKey(html: string): string {
  if (html.includes('id="paBody"') && html.includes('pa-dash-stats-grid')) {
    return 'dashboard';
  }
  if (html.includes('id="paActBody"')) {
    return 'recent-activities';
  }
  const panel = html.match(
    /id="(pa(?:Tech|Project|Cat|Media|Blog|Exp|Tool|Settings|Msg|Contact|Dash)[^"]*)"/,
  );
  return panel?.[1] ?? `legacy-${html.length}`;
}

/**
 * Injects legacy page HTML. Uses a route key to force a clean swap on
 * client navigation, and useLayoutEffect to sync innerHTML when the prop changes.
 */
type LegacyHtmlProps = { html: string };

export default function LegacyHtml({ html }: LegacyHtmlProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pageKey = legacyPageKey(html);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.innerHTML === html) return;
    el.innerHTML = html;
  }, [html, pageKey]);

  return (
    <div
      ref={ref}
      key={pageKey}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
