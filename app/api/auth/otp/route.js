import { NextResponse } from 'next/server';
import { isSupabaseServerConfigured } from '@/lib/supabase/server';
import { issueOtp, EMAIL_RE } from '@/lib/otp-flow';
import { hitRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_IP = 20;

// Signup verification codes only. Sign-in codes are issued by /api/auth/signin
// after the password check, and are bound to that purpose, so a code requested
// here can never be redeemed to sign in to an existing account.
//
// Account creation happens in /api/auth/verify, after the code is proven.
// Creating the user here (as this route used to) made "Resend code" fail with
// "User already exists", left unverified accounts behind whenever sending
// failed, and let anyone pre-register someone else's email with their own
// password and probe which emails are registered.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const { password } = body || {};

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const ipLimit = hitRateLimit(`otp:ip:${getClientIp(request)}`, MAX_OTP_REQUESTS_PER_IP, IP_WINDOW_MS);
    if (!ipLimit.ok) {
      return NextResponse.json(
        {
          error: `Too many requests. Try again in ${Math.ceil(ipLimit.retryAfter / 60)} minute(s).`,
          retryAfter: ipLimit.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 400 }
      );
    }

    const { status, body: result } = await issueOtp(email, 'signup');
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[auth] OTP request failed:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
