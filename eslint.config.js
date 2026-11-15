import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**", "外部資源/**", "assets/generated/**", "docs/refs/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "tools/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"]
    }
  },
  {
    files: ["tools/**/*.mjs"],
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["service-worker.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.serviceworker, ...globals.browser }
    }
  }
];
