import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSafeNextPath } from '@/lib/safe-redirect';

export const runtime = 'nodejs';

// Only the password-recovery link is handled here. Never add 'magiclink' or
// 'signup' without thinking through what a stolen link would allow.
const ALLOWED_TYPES = new Set(['recovery']);

// Target of the link in the Supabase "Reset Password" email template:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
// Verifying the token hash server-side works on any device/browser, unlike the
// PKCE code flow which needs the browser that requested the reset.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = getSafeNextPath(searchParams.get('next'), '/reset-password');

  const failure = NextResponse.redirect(`${origin}/reset-password?error=invalid_link`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!tokenHash || !ALLOWED_TYPES.has(type) || !url || !anonKey) {
    return failure;
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(`${origin}${next}`);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return failure;
  }

  return response;
}
