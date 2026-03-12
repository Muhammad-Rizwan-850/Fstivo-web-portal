const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // =====================================================
  // ESLINT: Allow build with warnings
  // =====================================================
  eslint: {
    ignoreDuringBuilds: true,
  },

  // =====================================================
  // PERFORMANCE: Compiler optimizations
  // =====================================================
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // =====================================================
  // PERFORMANCE: Image optimization
  // =====================================================
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Enable dangerously allow SVG for optimization
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // =====================================================
  // PERFORMANCE: Experimental features
  // =====================================================
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/themes',
      'recharts',
      'date-fns',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // NOTE: removed deprecated/experimental `turbo` config to avoid build warnings.
  },

  // Optional metadata base for URLs (set NEXT_PUBLIC_METADATA_BASE in env)
  // Note: Next.js 15 uses generateMetadata() in pages instead of metadata config

  // =====================================================
  // PERFORMANCE: Webpack optimizations
  // =====================================================
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Use webpack cache for faster rebuilds
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve('.next/cache/webpack'),
      };

      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React core framework
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // UI library chunks
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|@radix-ui-icons)[\\/]/,
            priority: 35,
          },
          // Heavy chart library
          charts: {
            name: 'charts',
            chunks: 'all',
            
            test: /[\\/]node_modules[\\/](recharts|d3|d3-array|d3-scale|d3-shape)[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Common libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const match = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              const packageName = match ? match[1] : 'unknown';
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 20,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Shared commons
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
          },
        },
      };

      // Minification
      config.optimization.minimize = true;

      // Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
    }

    // Module resolution optimizations
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Optimizations for specific packages
        'lodash-es': 'lodash',
      },
    };

    // Ignore plugins to reduce bundle size
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );
    }

    return config;
  },

  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Headers for performance
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=120',
        },
      ],
    },
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=604800',
        },
      ],
    },
  ],
};

module.exports = withBundleAnalyzer(nextConfig);
