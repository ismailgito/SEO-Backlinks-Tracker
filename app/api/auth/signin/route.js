import { NextResponse } from 'next/server';
import { createEphemeralAnonClient, getSupabaseAdminClient } from '@/lib/supabase/admin';
import { issueOtp, EMAIL_RE } from '@/lib/otp-flow';
import { hitRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 30;
const MAX_PASSWORD_LENGTH = 1024;

const INVALID_CREDENTIALS = 'Invalid email or password';

// Step 1 of two-step sign-in: check the password, then email a one-time code.
//
// The password is checked here, on the server, and the session Supabase returns
// for a correct password is thrown away: if the browser did this itself
// (supabase.auth.signInWithPassword) it would hold a live session before the
// code was ever entered. A session is only created by /api/auth/verify, after the
// code is proven (step 2).
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body?.password;

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }
    if (typeof password !== 'string' || !password || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: 'Please enter your password' }, { status: 400 });
    }

    // Throttle password guessing per account and per IP, before touching Supabase.
    const limits = [
      hitRateLimit(`signin:email:${email}`, MAX_PER_EMAIL, WINDOW_MS),
      hitRateLimit(`signin:ip:${getClientIp(request)}`, MAX_PER_IP, WINDOW_MS),
    ];
    const blocked = limits.find((l) => !l.ok);
    if (blocked) {
      return NextResponse.json(
        {
          error: `Too many sign-in attempts. Try again in ${Math.ceil(blocked.retryAfter / 60)} minute(s).`,
          retryAfter: blocked.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(blocked.retryAfter) } }
      );
    }

    const anon = createEphemeralAnonClient();
    const admin = getSupabaseAdminClient();
    if (!anon || !admin) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 400 });
    }

    const { data, error } = await anon.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.name === 'AuthRetryableFetchError') {
        console.error('[auth] Supabase unreachable:', error.message);
        return NextResponse.json(
          { error: 'Authentication service is unreachable. Check NEXT_PUBLIC_SUPABASE_URL in .env.local.' },
          { status: 503 }
        );
      }
      if (error.code === 'email_not_confirmed') {
        // Only reported for a correct password, so it doesn't reveal which emails exist.
        return NextResponse.json(
          { error: 'Your email is not verified yet. Sign up again to get a new verification code.' },
          { status: 403 }
        );
      }
      // Same answer for an unknown email and a wrong password.
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Correct password. Drop the session we were just handed (scope 'local' so
    // the person's other devices stay signed in); the real one is issued after
    // the code is verified.
    if (data?.session?.access_token) {
      admin.auth.admin
        .signOut(data.session.access_token, 'local')
        .catch((err) => console.error('[auth] Could not revoke pre-2FA session:', err?.message || err));
    }

    const { status, body: result } = await issueOtp(email, 'signin');
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[auth] Sign-in failed:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
