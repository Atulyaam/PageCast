import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/",
      ".next/**",
      "out/",
      "out/**",
      "build/",
      "build/**",
      "dist/",
      "dist/**",
      "node_modules/",
      "node_modules/**",
      "docs/",
      "docs/**",
      "*.md",
    ],
  },
  ...nextConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/no-danger": "error",
    },
  },
];

export default eslintConfig;
