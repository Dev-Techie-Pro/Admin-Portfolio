import { publicCorsJson } from '@/lib/api/public-cors';

const PUBLIC_ERROR_MESSAGE = 'An unexpected error occurred. Please try again later.';

export function publicRouteError(
  request: Request,
  scope: string,
  error: unknown,
  status = 500,
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message);
  return publicCorsJson(request, { error: PUBLIC_ERROR_MESSAGE }, { status });
}
