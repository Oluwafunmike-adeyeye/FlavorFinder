/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Netlify
  output: 'standalone',
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.themealdb.com',
        pathname: '/images/media/meals/**',
      },
      {
        protocol: 'https',
        hostname: 'nominatim.openstreetmap.org',
      },
    ],
  },

  // Essential headers only
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Netlify-CDN-Cache-Control', value: 'no-store' }
        ],
      }
    ];
  },

  // Netlify-specific optimizations
  experimental: {
    appDir: true,
  },

  // Temporary during development (remove for production)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;