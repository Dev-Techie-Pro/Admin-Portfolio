import { NextResponse } from 'next/server';

export function logRouteError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message);
}

export function jsonInternalError(scope: string, error: unknown, status = 500) {
  logRouteError(scope, error);
  return NextResponse.json({ error: 'An unexpected error occurred.' }, { status });
}
