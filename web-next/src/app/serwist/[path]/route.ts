// Phát service worker /serwist/sw.js (Serwist + Turbopack). Danh sách precache tạo lúc build.
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  esbuildOptions: { sourcemap: false },
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  // File tĩnh của bản build + icon, audio bài học, mascot bài học (không precache logo PNG lớn).
  globPatterns: [
    ".next/static/**/*.{js,css}",
    "public/icons/**/*",
    "public/audio/**/*.mp3",
    "public/brand/lesson/**/*",
  ],
});
