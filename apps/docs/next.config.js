const path = require("path");
const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Ensure packages hoisted to monorepo root are resolved by Turbopack/webpack
  transpilePackages: ["next-themes"],
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
