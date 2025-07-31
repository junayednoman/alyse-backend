import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "error",
      "no-console": "warn",
      "prefer-const": "error",
      "no-unused-expressions": "error",
      "no-undef": "error",
      "prettier/prettier": 0,
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [".node_modules/*", "dist"],
  },
  { ignores: ["dist", "node_modules"] },
];
