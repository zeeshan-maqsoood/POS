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
  // Remove output: 'export' to enable server-side rendering
  trailingSlash: true,
  
  // Disable problematic features
  experimental: {
    // Disable server components
    serverComponents: false,
    // Disable server actions
    serverActions: false,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Ignore the problematic route group
    config.module.rules.push({
      test: /\\(pos)\/page\.js$/,
      use: 'null-loader',
    });
    
    return config;
  },
  
  // Generate a simple build ID
  generateBuildId: () => 'build-' + Date.now(),
}

export default nextConfig
