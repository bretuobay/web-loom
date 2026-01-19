import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", ".turbo/**", "test-import.mjs"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": typescript
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_|^value$" }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off",
      // Disable React rules for this package (has both React and Vue adapters)
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/refs": "off"
    }
  }
];
