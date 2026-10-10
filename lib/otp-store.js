import crypto from 'node:crypto';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export const OTP_TTL_SECONDS = 10 * 60;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const REPROBE_INTERVAL_MS = 5 * 60 * 1000;

// Backed by Supabase (auth_otp_codes table + atomic RPC functions from
// supabase/migrations/20261009000000_auth_otp_codes.sql). Falls back to an
// in-memory store when the migration has not been applied yet (single
// instance only — apply the migration before deploying to multiple instances).
const memoryStore = globalThis.__backlinksOtpStore || new Map();
globalThis.__backlinksOtpStore = memoryStore;

let storeMode = null; // 'db' | 'memory'
let lastProbeAt = 0;
let warnedFallback = false;

export function hashOtp(email, code) {
  return crypto
    .createHash('sha256')
    .update(`${String(email).toLowerCase()}:${code}`)
    .digest('hex');
}

function warnFallback() {
  if (warnedFallback) return;
  warnedFallback = true;
  console.warn(
    '[auth] Supabase auth_otp_codes store unavailable — using in-memory OTP store (single instance only). ' +
      'Apply supabase/migrations/20261009000000_auth_otp_codes.sql in the Supabase SQL Editor, then restart the server.'
  );
}

function isMissingStoreError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '');
  return (
    ['42P01', 'PGRST202', 'PGRST205'].includes(code) ||
    /does not exist|could not find|not find the (table|function)|schema cache/i.test(message)
  );
}

async function resolveMode() {
  const now = Date.now();
  if (storeMode === 'db') return 'db';
  if (storeMode === 'memory' && now - lastProbeAt < REPROBE_INTERVAL_MS) return 'memory';

  lastProbeAt = now;
  if (!isSupabaseAdminConfigured()) {
    storeMode = 'memory';
    return 'memory';
  }

  // Idempotent probe: consumes a nonexistent code, no side effects.
  const { error } = await getSupabaseAdminClient().rpc('consume_auth_otp', {
    p_email: '__mode_probe__',
  });

  if (!error) {
    storeMode = 'db';
    return 'db';
  }

  storeMode = 'memory';
  if (isMissingStoreError(error)) {
    warnFallback();
  } else {
    console.error('[auth] OTP store probe failed, using in-memory fallback:', error.message);
  }
  return 'memory';
}

function memoryBegin(email, codeHash) {
  const now = Date.now();
  let row = memoryStore.get(email);
  if (!row || now - row.windowStart >= RATE_WINDOW_MS) {
    row = { sentCount: 0, windowStart: now, codeHash: '', attempts: 0, expiresAt: 0 };
  } else if (row.sentCount >= MAX_SENDS_PER_WINDOW) {
    const retryAfter = Math.max(
      1,
      Math.ceil((row.windowStart + RATE_WINDOW_MS - now) / 1000)
    );
    return {
      ok: false,
      error: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      retryAfter,
    };
  }
  row.sentCount += 1;
  row.codeHash = codeHash;
  row.attempts = 0;
  row.expiresAt = now + OTP_TTL_SECONDS * 1000;
  memoryStore.set(email, row);
  return { ok: true };
}

function memoryCheck(email, codeHash) {
  const row = memoryStore.get(email);
  if (!row || !row.codeHash) return { status: 'missing' };
  if (Date.now() > row.expiresAt) {
    row.codeHash = '';
    return { status: 'expired' };
  }
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    row.codeHash = '';
    return { status: 'locked' };
  }
  if (row.codeHash !== codeHash) {
    row.attempts += 1;
    if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
      row.codeHash = '';
      return { status: 'locked' };
    }
    return { status: 'mismatch', remaining: MAX_VERIFY_ATTEMPTS - row.attempts };
  }
  return { status: 'ok' };
}

export async function beginOtpRequest(email, code) {
  const normalized = String(email).toLowerCase();
  const codeHash = hashOtp(normalized, code);

  if ((await resolveMode()) === 'db') {
    const { data, error } = await getSupabaseAdminClient().rpc('create_auth_otp', {
      p_email: normalized,
      p_code_hash: codeHash,
      p_ttl_seconds: OTP_TTL_SECONDS,
    });
    if (error) {
      if (isMissingStoreError(error)) {
        storeMode = 'memory';
        lastProbeAt = Date.now();
        warnFallback();
      } else {
        console.error('[auth] Failed to store OTP code:', error.message);
        return { ok: false, error: 'Could not create verification code. Please try again.' };
      }
    } else {
      return {
        ok: Boolean(data?.ok),
        error: data?.error,
        retryAfter: data?.retry_after,
      };
    }
  }

  return memoryBegin(normalized, codeHash);
}

export async function checkOtp(email, code) {
  const normalized = String(email).toLowerCase();
  const codeHash = hashOtp(normalized, code);

  if ((await resolveMode()) === 'db') {
    const { data, error } = await getSupabaseAdminClient().rpc('verify_auth_otp', {
      p_email: normalized,
      p_code_hash: codeHash,
    });
    if (error) {
      if (isMissingStoreError(error)) {
        storeMode = 'memory';
        lastProbeAt = Date.now();
        warnFallback();
      } else {
        console.error('[auth] Failed to verify OTP code:', error.message);
        return { status: 'error' };
      }
    } else {
      return { status: data?.status || 'error', remaining: data?.remaining };
    }
  }

  return memoryCheck(normalized, codeHash);
}

export async function consumeOtp(email) {
  const normalized = String(email).toLowerCase();

  if ((await resolveMode()) === 'db') {
    const { error } = await getSupabaseAdminClient().rpc('consume_auth_otp', {
      p_email: normalized,
    });
    if (error && !isMissingStoreError(error)) {
      console.error('[auth] Failed to consume OTP code:', error.message);
    }
    if (error && isMissingStoreError(error)) {
      storeMode = 'memory';
      lastProbeAt = Date.now();
      warnFallback();
      memoryStore.delete(normalized);
    }
    return;
  }

  const row = memoryStore.get(normalized);
  if (row) {
    row.codeHash = '';
    row.attempts = 0;
  }
}
