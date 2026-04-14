/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https:",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    if (!isProd) return [];
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
