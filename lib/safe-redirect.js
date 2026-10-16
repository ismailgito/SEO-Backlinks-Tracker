// Only allows same-site relative paths. Rejects absolute URLs, protocol-relative
// URLs (//host), backslash tricks, and "@host" suffixes that become the host
// once appended to an origin.
export function getSafeNextPath(next, fallback = '/') {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  if (next.includes('\\')) return fallback;

  try {
    const base = 'http://safe-redirect.invalid';
    const parsed = new URL(next, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
