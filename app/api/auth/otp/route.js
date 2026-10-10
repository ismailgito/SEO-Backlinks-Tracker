import { NextResponse } from 'next/server';
import { sendOtpEmail, isResendConfigured } from '@/lib/resend';
import { isSupabaseServerConfigured } from '@/lib/supabase/server';
import { beginOtpRequest, consumeOtp, OTP_TTL_SECONDS } from '@/lib/otp-store';

export const runtime = 'nodejs';

const SEND_TIMEOUT_MS = 60 * 1000;
let warnedDefaultSender = false;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Email service timed out. Please try again.')),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function POST(request) {
  try {
    const { email, type, password } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (type === 'signup' && isSupabaseServerConfigured()) {
      const { getSupabaseAdminClient } = require('@/lib/supabase/admin');
      const admin = getSupabaseAdminClient();
      if (admin) {
        if (!password || password.length < 8) {
          return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }
        const { data, error } = await admin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: false,
        });
        
        if (error) {
          if (error.message.includes('already') || error.code === 'user_already_exists') {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
          }
        }
      }
    }

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 400 }
      );
    }

    if (
      !warnedDefaultSender &&
      isResendConfigured() &&
      !process.env.RESEND_FROM_EMAIL
    ) {
      warnedDefaultSender = true;
      console.warn(
        '[auth] RESEND_FROM_EMAIL is not set — defaulting to onboarding@resend.dev, ' +
          'which only delivers to the Resend account owner (test mode). ' +
          'Set a verified sender in .env.local for production.'
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const stored = await beginOtpRequest(email, otpCode);
    if (!stored.ok) {
      return NextResponse.json(
        {
          error: stored.error || 'Could not create verification code. Please try again.',
          retryAfter: stored.retryAfter,
        },
        { status: stored.retryAfter ? 429 : 500 }
      );
    }

    let result;
    try {
      result = await withTimeout(
        sendOtpEmail({ toEmail: email, otpCode }),
        SEND_TIMEOUT_MS
      );
    } catch (err) {
      await consumeOtp(email);
      return NextResponse.json({ error: err.message }, { status: 504 });
    }

    if (!result.success) {
      await consumeOtp(email);
      return NextResponse.json(
        { error: result.error, retryAfter: result.retryAfter },
        { status: result.retryAfter ? 429 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      simulated: Boolean(result.simulated),
      otpCode: result.simulated ? otpCode : undefined,
      expiresIn: OTP_TTL_SECONDS,
    });
  } catch (error) {
    console.error('[auth] OTP request failed:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
