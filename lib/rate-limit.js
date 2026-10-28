// Small fixed-window rate limiter. In-memory, so it is per server instance:
// good enough for a single instance / dev, but use a shared store (e.g. the
// Supabase RPC pattern in lib/otp-store.js) before running multiple instances.
const buckets = globalThis.__backlinksRateLimit || new Map();
globalThis.__backlinksRateLimit = buckets;

const MAX_BUCKETS = 5000;

// Last hop of x-forwarded-for: the entry appended by our own proxy. Earlier
// entries are client-supplied and can be spoofed to dodge per-IP limits.
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',').pop().trim() : '';
  return ip || request.headers.get('x-real-ip') || 'unknown';
}

export function hitRateLimit(key, limit, windowMs) {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (now - v.start >= v.windowMs) buckets.delete(k);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0, windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}
