/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 支持 monorepo workspace 包
  transpilePackages: ['@reinvention/ui', '@reinvention/types', '@reinvention/prompts'],
  experimental: {
    // 优化 PDF.js 在客户端的打包
    optimizePackageImports: ['lucide-react'],
  },
  // Webpack 配置：让 pdfjs-dist 在客户端正常工作
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pdfjs-dist 需要 worker，禁用 Node.js 模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // 安全 headers（为政府场景配置）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // 政府看板特殊 CSP
        source: '/gov-dashboard/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
