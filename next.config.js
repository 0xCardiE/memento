/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js polyfills for client-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // External packages that should not be bundled
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Handle indexedDB and other browser APIs during SSR
    if (isServer) {
      config.externals.push('indexeddb-js');
    }

    return config;
  },
  transpilePackages: ['@web3modal/wagmi'],
}

export default nextConfig 