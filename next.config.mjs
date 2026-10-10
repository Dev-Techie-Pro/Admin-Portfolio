import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function supabaseOrigins() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const ws = url.origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    return [url.origin, ws];
  } catch {
    return [];
  }
}

const noCacheJs = 'public, max-age=0, must-revalidate';

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/blog-post/view/:id',
        destination: '/blog-post?open=:id',
        permanent: false,
      },
      {
        source: '/settings/integrations',
        destination: '/settings/system',
        permanent: false,
      },
      {
        source: '/settings/logs',
        destination: '/settings/general',
        permanent: false,
      },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const staticCache = isProd
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate';
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/js/chunks/:path*',
        headers: [{ key: 'Cache-Control', value: staticCache }],
      },
      {
        source: '/js/vendor/:path*',
        headers: [{ key: 'Cache-Control', value: staticCache }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: isProd ? 'public, max-age=604800' : staticCache }],
      },
      {
        source: '/js/main.js',
        headers: [{ key: 'Cache-Control', value: noCacheJs }],
      },
      {
        source: '/js/:file(boot-prefetch|prefetch-config|body-loader-template).js',
        headers: [{ key: 'Cache-Control', value: noCacheJs }],
      },
      {
        source: '/js/core/:path*',
        headers: [{ key: 'Cache-Control', value: staticCache }],
      },
      {
        source: '/js/modules/:path*',
        headers: [{ key: 'Cache-Control', value: staticCache }],
      },
      {
        source: '/js/utils/:path*',
        headers: [{ key: 'Cache-Control', value: staticCache }],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    return config;
  },
};

export default nextConfig;
