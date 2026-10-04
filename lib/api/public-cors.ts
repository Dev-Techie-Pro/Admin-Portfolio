import { NextResponse } from 'next/server';

function allowedOrigins(): string[] {
  const raw = process.env.PORTFOLIO_PUBLIC_ORIGINS?.trim()
    || process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim()
    || '';
  const list = raw.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
  }
  return [...new Set(list)];
}

export function withPublicCors(request: Request, response: NextResponse) {
  const origin = request.headers.get('origin')?.replace(/\/$/, '');
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  } else if (allowed.length === 1) {
    response.headers.set('Access-Control-Allow-Origin', allowed[0]);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export function publicCorsOptions(request: Request) {
  return withPublicCors(request, new NextResponse(null, { status: 204 }));
}

export function publicCorsJson(request: Request, data: unknown, init?: ResponseInit) {
  return withPublicCors(request, NextResponse.json(data, init));
}
