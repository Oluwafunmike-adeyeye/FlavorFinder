/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Netlify
  output: 'standalone',

  // Basic image optimization 
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

  // Basic security headers 
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // Allow API CORS (simplified)
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ];
  },

  // Enable React Strict Mode
  reactStrictMode: true,
};

module.exports = nextConfig;