/** @type {import('next').NextConfig} */
const securityHeaders = [
  // The auth modal must not be embeddable in another site (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  webpack: (config) => {
    // Lets server code import email templates as plain strings:
    //   import html from '@/lib/email/password-reset.html';
    config.module.rules.push({
      test: /\.html$/,
      type: 'asset/source',
    });
    return config;
  },
};

module.exports = nextConfig;
