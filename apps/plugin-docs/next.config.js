const path = require("path");
const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Static export for Cloudflare Pages / Wrangler assets deploy
  output: "export",
  // next/image requires this when output=export
  images: { unoptimized: true },
  // Ensure workspace package sources are transpiled
  transpilePackages: ["next-themes", "@repo/docs-theme"],
  // Ensure packages hoisted to monorepo root are resolved by webpack
  webpack: (config) => {
    config.resolve.modules.push(path.resolve(__dirname, "../../node_modules"));
    return config;
  },
};

module.exports = withMDX(nextConfig);
