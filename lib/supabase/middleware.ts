import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type NextInit = { request: NextRequest } | { request: { headers: Headers } };

export function createMiddlewareClient(request: NextRequest, nextInit?: NextInit) {
  const init: NextInit = nextInit ?? { request };
  let supabaseResponse = NextResponse.next(init);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next(init);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, supabaseResponse };
}
