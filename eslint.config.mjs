import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      ".turbo/**",
      "next-env.d.ts",
      "apps/marko-mvvm/**",
    ],
  },
  {
    rules: {
      // Disable Next.js-specific rules for non-Next.js packages
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
