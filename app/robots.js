const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/auth/', '/reset-password'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
