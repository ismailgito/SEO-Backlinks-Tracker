import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseAnonClient } from '@/lib/supabase/admin';
import { checkOtp } from '@/lib/otp-store';
import { hitRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_VERIFY_PER_IP = 30;

// Ensures the user exists, applies requested profile changes, then returns a
// verifiable magiclink token.
// - purpose 'signup' creates/completes a NEW account. It refuses an account that
//   is already confirmed: a signup code only proves mailbox access, and must not
//   double as a way to sign in to an existing account without its password.
// - purpose 'signin' is the second step of two-step sign-in. Its code is only
//   issued after the password was verified, and it only works for an existing,
//   confirmed account.
// - generateLink auto-creates missing users, but its token is not verifiable;
//   a second call on the now-existing user yields a valid one.
// - GoTrue invalidates issued action tokens whenever the user record is
//   updated, so all mutations must happen BEFORE the final token is minted.
async function ensureMagicLink(admin, email, { password, purpose }) {
  const first = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (first.error) return { error: first.error };

  const userId = first.data?.user?.id;
  if (!userId) return { error: new Error('User missing from response') };

  const confirmed = Boolean(first.data.user.email_confirmed_at);
  if (purpose === 'signup' && confirmed) return { error: new Error('Account exists'), accountExists: true };
  if (purpose === 'signin' && !confirmed) return { error: new Error('Account not found'), notFound: true };

  const metadata = first.data.user.user_metadata || {};
  if (purpose === 'signup' && Object.keys(metadata).length === 0) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { signup_method: 'email_otp' },
    });
    if (error) console.error('[auth] Could not set user metadata:', error.message);
  }

  // Only a brand-new (still unconfirmed) signup takes the password from this
  // request; password changes for existing accounts go through the reset flow,
  // which revokes other sessions.
  if (purpose === 'signup' && password && !confirmed) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error && error.code !== 'same_password') {
      return { error, passwordError: true };
    }
  }

  const second = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (second.error) return { error: second.error };

  const hashedToken = second.data?.properties?.hashed_token;
  if (!hashedToken) return { error: new Error('Verification token missing from response') };

  return { hashedToken, userId };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const code = body?.code;
    const password = body?.password;
    const purpose = body?.purpose === 'signin' ? 'signin' : 'signup';

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!code || !/^\d{6}$/.test(String(code))) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit verification code' },
        { status: 400 }
      );
    }

    if (password !== undefined && password !== null && password !== '' &&
        (typeof password !== 'string' || password.length < 8)) {
      return NextResponse.json(
        { error: 'Password should be at least 8 characters long' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const anon = getSupabaseAnonClient();
    if (!admin || !anon) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 400 }
      );
    }

    const ipLimit = hitRateLimit(`verify:ip:${getClientIp(request)}`, MAX_VERIFY_PER_IP, IP_WINDOW_MS);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.', retryAfter: ipLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    const otpCheck = await checkOtp(email, code, purpose);
    switch (otpCheck.status) {
      case 'missing':
        return NextResponse.json(
          { error: 'No active verification code. Please request a new one.' },
          { status: 400 }
        );
      case 'expired':
        return NextResponse.json(
          { error: 'Verification code expired. Please request a new one.' },
          { status: 400 }
        );
      case 'locked':
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new code.' },
          { status: 429 }
        );
      case 'mismatch': {
        const remaining = otpCheck.remaining ?? 0;
        return NextResponse.json(
          {
            error:
              remaining > 0
                ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
                : 'Too many failed attempts. Please request a new code.',
          },
          { status: 401 }
        );
      }
      case 'ok':
        break;
      default:
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' },
          { status: 500 }
        );
    }

    const normalizedEmail = String(email).toLowerCase();

    const link = await ensureMagicLink(admin, normalizedEmail, { password, purpose });
    if (link.error) {
      if (link.accountExists) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      if (link.notFound) {
        return NextResponse.json(
          { error: 'Could not complete sign-in. Please try again.' },
          { status: 400 }
        );
      }
      if (link.passwordError) {
        // e.g. weak_password: the user can fix this, so it's a 4xx, not a crash.
        return NextResponse.json(
          { error: link.error.message || 'Could not set password.' },
          { status: link.error.status && link.error.status < 500 ? link.error.status : 400 }
        );
      }
      console.error('[auth] Could not create magic link:', link.error.message || 'missing token');
      if (link.error.name === 'AuthRetryableFetchError') {
        return NextResponse.json(
          { error: 'Authentication service is unreachable. Check NEXT_PUBLIC_SUPABASE_URL in .env.local.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Could not create session. Please try again.' },
        { status: 500 }
      );
    }

    // Mint a real Supabase session without touching the (broken) email delivery path.
    const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
      type: 'magiclink',
      token_hash: link.hashedToken,
    });
    if (verifyError || !verified?.session) {
      return NextResponse.json(
        { error: verifyError?.message || 'Session creation failed. Please try again.' },
        { status: 500 }
      );
    }

    // checkOtp already invalidated the code atomically, so it can't be replayed.

    return NextResponse.json({
      success: true,
      session: {
        access_token: verified.session.access_token,
        refresh_token: verified.session.refresh_token,
        expires_at: verified.session.expires_at,
      },
      user: {
        id: verified.user.id,
        email: verified.user.email,
        user_metadata: verified.user.user_metadata,
      },
    });
  } catch (error) {
    console.error('[auth] OTP verification failed:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
