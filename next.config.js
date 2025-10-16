/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'automotive-marketplace.onrender.com',
      },
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // Compression
  compress: true,

  // Configure for dynamic app with authentication
  output: 'standalone',

  // Disable problematic optimizations for Render
  swcMinify: false,

  // Enforce strict type checking and linting for production
  typescript: {
    ignoreBuildErrors: false, // ✅ Enforcing type safety
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Enforcing code quality
  },

  serverRuntimeConfig: {
    nextGeoIpLookupDisabled: 1,
  },

  // Environment variables for progressive scaling
  env: {
    USE_REDIS: process.env.USE_REDIS || 'false',
    USE_ELASTICSEARCH: process.env.USE_ELASTICSEARCH || 'false',
    USE_S3: process.env.USE_S3 || 'false',
    MAX_IMAGES_PER_LISTING: process.env.MAX_IMAGES_PER_LISTING || '5',
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig