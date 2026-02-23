const path = require("path");
const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Static export for Cloudflare Pages
  output: "export",
  // next/image requires unoptimized: true when using output: export
  images: { unoptimized: true },
  // Ensure packages hoisted to monorepo root are resolved by webpack
  transpilePackages: ["next-themes"],
  webpack: (config) => {
    config.resolve.modules.push(path.resolve(__dirname, "../../node_modules"));
    return config;
  },
};

module.exports = withMDX(nextConfig);
