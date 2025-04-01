/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
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

  async headers() {
    return [
      // Global security headers
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // API routes with STRONGER cache control
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          // Critical cache prevention headers:
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Netlify-CDN-Cache-Control', value: 'no-store' },
          { key: 'Vary', value: 'query' }, 
        ],
      },
    ];
  },

  reactStrictMode: true,
};

module.exports = nextConfig;