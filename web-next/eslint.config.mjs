import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Cấm phụ thuộc chỉ Vercel mới có (spec mục 3.2).
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@vercel/*"], message: "Không dùng @vercel/* — app phải chạy được trên VPS." }] },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([
    "dist/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "public/sw.js",
    "public/swe-worker*.js",
  ]),
]);
