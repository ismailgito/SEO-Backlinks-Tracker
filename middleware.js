import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Anonymous visitors have no Supabase auth cookie, so there is nothing to
  // refresh: skip the network round-trip to Supabase on every request.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  if (!hasAuthCookie) {
    return response;
  }

  // Refreshes the session token if expired — must run before any
  // supabase.auth.getUser() call. Do not add code between client creation
  // and getUser().
  try {
    await supabase.auth.getUser();
  } catch (error) {
    // A Supabase outage must not take every page down with it.
    console.error('[middleware] Session refresh failed:', error?.message || error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|woff2?)$).*)',
  ],
};
