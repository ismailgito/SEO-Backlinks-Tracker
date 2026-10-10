import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseAnonClient } from '@/lib/supabase/admin';
import { checkOtp, consumeOtp } from '@/lib/otp-store';

export const runtime = 'nodejs';

// Ensures the user exists, applies requested profile changes, then returns a
// verifiable magiclink token.
// - generateLink auto-creates missing users, but its token is not verifiable;
//   a second call on the now-existing user yields a valid one.
// - GoTrue invalidates issued action tokens whenever the user record is
//   updated, so all mutations must happen BEFORE the final token is minted.
async function ensureMagicLink(admin, email, password) {
  const first = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (first.error) return { error: first.error };

  const userId = first.data?.user?.id;
  if (!userId) return { error: new Error('User missing from response') };

  const metadata = first.data.user.user_metadata || {};
  if (Object.keys(metadata).length === 0) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { signup_method: 'email_otp' },
    });
    if (error) console.error('[auth] Could not set user metadata:', error.message);
  }

  if (password) {
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
    const { email, code, password } = await request.json();

    if (!email || !email.includes('@')) {
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

    if (password && password.length < 8) {
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

    const otpCheck = await checkOtp(email, code);
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

    const link = await ensureMagicLink(admin, normalizedEmail, password);
    if (link.error) {
      if (link.passwordError) {
        return NextResponse.json(
          { error: link.error.message || 'Could not set password.' },
          { status: 500 }
        );
      }
      console.error('[auth] Could not create magic link:', link.error.message || 'missing token');
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

    // Only consume the code once a session has been successfully created.
    await consumeOtp(email);

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
