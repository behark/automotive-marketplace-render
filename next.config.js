/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
    // Add your domain when deployed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
    ],
  },
  // Optimize for Render deployment
  output: 'standalone',

  // Environment variables for progressive scaling
  env: {
    USE_REDIS: process.env.USE_REDIS || 'false',
    USE_ELASTICSEARCH: process.env.USE_ELASTICSEARCH || 'false',
    USE_S3: process.env.USE_S3 || 'false',
    MAX_IMAGES_PER_LISTING: process.env.MAX_IMAGES_PER_LISTING || '5',
  },
}

module.exports = nextConfig