/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'your-vercel-app.vercel.app'],
  },
  trailingSlash: false,
  
  experimental: {
    serverComponents: false,
    serverActions: false,
    externalDir: true,
  },
  
  webpack: (config) => {
    // Handle route groups
    config.module.rules.push({
      test: /\\([^/]+)\/page\.[jt]sx?$/,
      use: [{
        loader: 'next/dist/build/webpack/loaders/next-route-loader',
        options: {
          page: '/[routeGroup]/page',
          absolutePagePath: './app/(pos)/page.js',
        },
      }],
    });
    
    return config;
  },
  
  generateBuildId: () => process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
}

export default nextConfig
