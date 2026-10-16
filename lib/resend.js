import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import passwordResetTemplate from '@/lib/email/password-reset.html';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 3;

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function isResendConfigured() {
  if (isSmtpConfigured()) {
    return true;
  }
  const apiKey = process.env.RESEND_API_KEY;
  return Boolean(apiKey && apiKey.startsWith('re_'));
}

export function getResendClient() {
  if (!isSmtpConfigured()) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith('re_')) {
      return null;
    }
    return new Resend(apiKey);
  }
  return null;
}

function getSmtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function checkRateLimit(email) {
  const lastSent = rateLimitStore.get(email);
  if (!lastSent) {
    return { allowed: true, remaining: MAX_EMAILS_PER_WINDOW };
  }
  const now = Date.now();
  const timeSinceLast = now - lastSent;
  if (timeSinceLast < RATE_LIMIT_WINDOW) {
    const countInWindow = (rateLimitStore.get(`${email}:count`) || 0) + 1;
    if (countInWindow > MAX_EMAILS_PER_WINDOW) {
      const timeLeft = RATE_LIMIT_WINDOW - timeSinceLast;
      return { allowed: false, retryAfter: timeLeft };
    }
    return { allowed: true, remaining: MAX_EMAILS_PER_WINDOW - countInWindow };
  }
  rateLimitStore.delete(email);
  rateLimitStore.delete(`${email}:count`);
  return { allowed: true, remaining: MAX_EMAILS_PER_WINDOW };
}

const rateLimitStore = new Map();

function renderOtpHtml(otpCode) {
  return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E0E0E0; background: #F7F7F7;">
          <h2 style="color: #111111; letter-spacing: -0.02em; margin-bottom: 8px;">Awesome Free SEO Backlinks</h2>
          <p style="color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0;">Account Verification</p>
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 20px 0;" />
          <p style="color: #111111; font-size: 16px;">Use the following one-time verification code (OTP) to continue:</p>
          <div style="background: #FFFFFF; border: 2px solid #0B6B4F; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #0B6B4F; margin: 24px 0;">
            ${otpCode}
          </div>
          <p style="color: #888888; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
        </div>
      `;
}

function recordSent(toEmail) {
  rateLimitStore.set(toEmail, Date.now());
  rateLimitStore.set(`${toEmail}:count`, (rateLimitStore.get(`${toEmail}:count`) || 0) + 1);
}

export async function sendOtpEmail({ toEmail, otpCode }) {
  if (!isResendConfigured()) {
    console.log(`[DEMO MODE] Simulated OTP email sent to ${toEmail}: Code is ${otpCode}`);
    return { success: true, simulated: true };
  }

  const rateCheck = checkRateLimit(toEmail);
  if (!rateCheck.allowed) {
    return { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.retryAfter / 1000)} seconds`, retryAfter: rateCheck.retryAfter };
  }

  return deliverEmail({
    toEmail,
    subject: `Your Verification Code: ${otpCode} — Awesome Free SEO Backlinks`,
    html: renderOtpHtml(otpCode),
    text: `Your verification code: ${otpCode}. This code will expire in 10 minutes. If you did not request this, please disregard this email.`,
  });
}

// Sends through SMTP when configured, otherwise Resend. No demo-mode or
// rate-limit logic here; callers handle those.
async function deliverEmail({ toEmail, subject, html, text }) {
  try {
    if (isSmtpConfigured()) {
      const transport = getSmtpTransport();
      const info = await transport.sendMail({
        from: process.env.SMTP_FROM || `Awesome Free SEO Backlinks <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html,
        text,
        headers: {
          'X-Priority': '1',
          'Importance': 'high',
          'X-MSMail-Priority': 'High',
        },
      });
      recordSent(toEmail);
      return { success: true, data: info };
    }

    const resend = getResendClient();
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from,
      to: toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      if (error.message && error.message.includes('rate limit')) {
        recordSent(toEmail);
      }
      return { success: false, error: error.message };
    }
    recordSent(toEmail);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { success: false, error: err.message };
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPasswordResetHtml({ toEmail, resetUrl }) {
  // resetUrl lands inside href="..." and as link text, so escape it for HTML.
  return passwordResetTemplate
    .replaceAll('{{ .Email }}', escapeHtml(toEmail))
    .replaceAll('{{ .ResetURL }}', escapeHtml(resetUrl));
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }) {
  if (!isResendConfigured()) {
    // Never reveal the link to the requester; only the server log gets it.
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Email delivery is not configured' };
    }
    console.log(`[DEMO MODE] Password reset link for ${toEmail}: ${resetUrl}`);
    return { success: true, simulated: true };
  }

  return deliverEmail({
    toEmail,
    subject: 'Reset your password — Awesome Free SEO Backlinks',
    html: renderPasswordResetHtml({ toEmail, resetUrl }),
    text: `Reset your Awesome Free SEO Backlinks password: ${resetUrl}\n\nThis link can be used once and expires in 1 hour. If you did not request this, you can safely ignore this email — your password will not change.`,
  });
}
