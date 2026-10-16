import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/resend';
import { hitRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0].trim() : '') || 'unknown';
}

// The reset link is built from a trusted base URL, never from request headers
// (a spoofed Host header would otherwise let an attacker point the link at
// their own site).
function getAppUrl(request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.NODE_ENV !== 'production') return new URL(request.url).origin;
  return null;
}

// Creates a Supabase recovery token with the admin API (no email is sent by
// Supabase) and emails the link through the app's own SMTP/Resend sender.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const limits = [
      hitRateLimit(`forgot:email:${email}`, MAX_PER_EMAIL, WINDOW_MS),
      hitRateLimit(`forgot:ip:${getClientIp(request)}`, MAX_PER_IP, WINDOW_MS),
    ];
    const blocked = limits.find((l) => !l.ok);
    if (blocked) {
      return NextResponse.json(
        {
          error: `Too many requests. Try again in ${Math.ceil(blocked.retryAfter / 60)} minute(s).`,
          retryAfter: blocked.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(blocked.retryAfter) } }
      );
    }

    const admin = getSupabaseAdminClient();
    const appUrl = getAppUrl(request);
    if (!admin || !appUrl) {
      console.error('[auth] Password reset unavailable: Supabase admin client or NEXT_PUBLIC_APP_URL missing');
      return NextResponse.json(
        { error: 'Password reset is not available right now.' },
        { status: 503 }
      );
    }

    // generateLink(type: 'recovery') fails for unknown emails and never creates
    // a user. We return the same success response either way so the endpoint
    // can't be used to find out which emails are registered.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    const hashedToken = data?.properties?.hashed_token;
    if (error || !hashedToken) {
      if (error && error.code !== 'user_not_found') {
        console.error('[auth] Could not create recovery link:', error.message);
      }
      return NextResponse.json({ success: true });
    }

    const resetUrl =
      `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}` +
      `&type=recovery&next=${encodeURIComponent('/reset-password')}`;

    const result = await sendPasswordResetEmail({ toEmail: email, resetUrl });
    if (!result.success) {
      console.error('[auth] Password reset email failed:', result.error);
      return NextResponse.json(
        { error: 'Could not send the reset email. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth] Forgot password failed:', err);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
