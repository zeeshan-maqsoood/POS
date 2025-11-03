/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Disable trailing slash for cleaner URLs
  trailingSlash: false,

  // Enable server-side rendering
  output: 'standalone',

  // Experimental features (removed deprecated options)
  experimental: {
    // Add any current experimental features here if needed
  },

  // Generate build ID
  generateBuildId: () => 'dev',
}

export default nextConfig
