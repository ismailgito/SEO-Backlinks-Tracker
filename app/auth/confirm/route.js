import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSafeNextPath } from '@/lib/safe-redirect';

export const runtime = 'nodejs';

// Only the password-recovery link is handled here. Never add 'magiclink' or
// 'signup' without thinking through what a stolen link would allow.
const ALLOWED_TYPES = new Set(['recovery']);

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The emailed link lands here. Verifying the one-time token on this GET would
// let mail security scanners and link prefetchers burn it before the person
// clicks, so the GET only renders a confirmation button; the token is consumed
// by the POST below.
//   {appUrl}/auth/confirm?token_hash=...&type=recovery&next=/reset-password
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = getSafeNextPath(searchParams.get('next'), '/reset-password');

  if (!tokenHash || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Reset your password</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F7F7F7;font-family:system-ui,sans-serif;color:#111}
  main{max-width:420px;margin:16px;padding:32px;background:#fff;border:1px solid #E0E0E0;text-align:center}
  h1{font-size:20px;margin:0 0 8px}
  p{font-size:14px;color:#666;margin:0 0 24px}
  button{width:100%;padding:12px;background:#111;color:#fff;border:0;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
  button:hover{background:#0B6B4F}
</style>
</head>
<body>
<main>
  <h1>Reset your password</h1>
  <p>Continue to choose a new password for your account.</p>
  <form method="POST" action="/auth/confirm">
    <input type="hidden" name="token_hash" value="${escapeAttr(tokenHash)}" />
    <input type="hidden" name="type" value="${escapeAttr(type)}" />
    <input type="hidden" name="next" value="${escapeAttr(next)}" />
    <button type="submit">Continue</button>
  </form>
</main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

// Verifies the token hash server-side, which works on any device/browser
// (unlike the PKCE code flow, which needs the browser that requested the reset).
export async function POST(request) {
  const { origin } = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const tokenHash = form?.get('token_hash');
  const type = form?.get('type');
  const next = getSafeNextPath(form?.get('next'), '/reset-password');

  // 303 so the browser follows the redirect with a GET.
  const redirectTo = (path) => NextResponse.redirect(`${origin}${path}`, 303);
  const failure = () => redirectTo('/reset-password?error=invalid_link');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    typeof tokenHash !== 'string' ||
    !tokenHash ||
    typeof type !== 'string' ||
    !ALLOWED_TYPES.has(type) ||
    !url ||
    !anonKey
  ) {
    return failure();
  }

  let response = redirectTo(next);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = redirectTo(next);
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
    return failure();
  }

  return response;
}
