const path = require("path");
const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Ensure packages hoisted to monorepo root are resolved by Turbopack/webpack
  transpilePackages: ["next-themes"],
  async headers() {
    return [
      {
        // Security + cache headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Long-lived cache for fonts and static assets
        source: "/fonts/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs/mvvm-core",
        destination: "/docs/models",
        permanent: true,
      },
      {
        source: "/docs/fundamentals",
        destination: "/docs/getting-started",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.modules.push(path.resolve(__dirname, "../../node_modules"));
    return config;
  },
};

module.exports = withMDX(nextConfig);
