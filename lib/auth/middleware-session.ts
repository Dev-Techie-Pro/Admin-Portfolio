import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Resolve session user for middleware: JWT claims on HTML navigations, getUser on API routes.
 */
export async function resolveMiddlewareUser(
  supabase: SupabaseClient,
  pathname: string,
): Promise<User | null> {
  const useClaims = !pathname.startsWith('/api/');

  if (!useClaims) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (
      error
      && (error.code === 'refresh_token_not_found'
        || /refresh token/i.test(error.message || ''))
    ) {
      await supabase.auth.signOut();
      return null;
    }
    return user ?? null;
  }

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims?.sub) {
      const sub = String(data.claims.sub);
      const email = typeof data.claims.email === 'string' ? data.claims.email : undefined;
      return { id: sub, email } as User;
    }
  } catch {
    /* fall through */
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (
    error
    && (error.code === 'refresh_token_not_found'
      || /refresh token/i.test(error.message || ''))
  ) {
    await supabase.auth.signOut();
    return null;
  }
  return user ?? null;
}
