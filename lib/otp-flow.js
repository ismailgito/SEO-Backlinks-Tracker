import crypto from 'node:crypto';
import { sendOtpEmail, isResendConfigured } from '@/lib/resend';
import { beginOtpRequest, consumeOtp, OTP_TTL_SECONDS } from '@/lib/otp-store';

const SEND_TIMEOUT_MS = 20 * 1000;

// One address only: nodemailer treats , and ; as recipient separators, and
// angle brackets / quotes / control characters allow header or display-name tricks.
export const EMAIL_RE = /^[^\s@,;<>"'()[\]\\]+@[^\s@,;<>"'()[\]\\]+\.[^\s@,;<>"'()[\]\\]+$/;
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

// Creates a one-time code for `purpose` ('signup' | 'signin'), stores its hash
// and emails it. Callers must already have authorised the request (for sign-in
// that means the password was verified).
//
// Resolves to { status, body } ready for NextResponse.json: 200 on success.
// The code is only echoed back in non-production demo mode, where no email
// transport is configured and delivery is simulated.
export async function issueOtp(email, purpose) {
  if (
    !warnedDefaultSender &&
    isResendConfigured() &&
    !process.env.RESEND_FROM_EMAIL &&
    !process.env.SMTP_USER
  ) {
    warnedDefaultSender = true;
    console.warn(
      '[auth] RESEND_FROM_EMAIL is not set — defaulting to onboarding@resend.dev, ' +
        'which only delivers to the Resend account owner (test mode). ' +
        'Set a verified sender in .env.local for production.'
    );
  }

  const otpCode = crypto.randomInt(100000, 1000000).toString();

  const stored = await beginOtpRequest(email, otpCode, purpose);
  if (!stored.ok) {
    return {
      status: stored.retryAfter ? 429 : 500,
      body: {
        error: stored.error || 'Could not create verification code. Please try again.',
        retryAfter: stored.retryAfter,
      },
    };
  }

  let result;
  try {
    result = await withTimeout(sendOtpEmail({ toEmail: email, otpCode }), SEND_TIMEOUT_MS);
  } catch (err) {
    await consumeOtp(email);
    return { status: 504, body: { error: err.message } };
  }

  if (!result.success) {
    await consumeOtp(email);
    return {
      status: result.retryAfter ? 429 : 502,
      body: { error: result.error, retryAfter: result.retryAfter },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      simulated: Boolean(result.simulated),
      otpCode: result.simulated ? otpCode : undefined,
      expiresIn: OTP_TTL_SECONDS,
    },
  };
}
