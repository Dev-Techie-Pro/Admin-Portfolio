// @ts-nocheck
import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

function bearerMatchesSecret(authHeader: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  if (!authHeader || authHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Validates cron bearer token; in production CRON_SECRET must be set. */
export function authorizeCronRequest(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured for this deployment.' },
      { status: 503 },
    );
  }

  if (!cronSecret || !bearerMatchesSecret(authHeader, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
