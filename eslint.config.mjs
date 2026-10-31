import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "dist/**", "node_modules/**", "docs/**", "*.md"],
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
