/// <reference lib="webworker" />
/**
 * Service worker (Serwist). Nguyên tắc: KHÔNG cache dữ liệu riêng của người dùng.
 * - Precache: file tĩnh của bản build, icon, logo, audio bài học, trang /~offline.
 * - Cache khi dùng: audio bài học, dữ liệu nét chữ (/api/hanzi), ảnh thương hiệu.
 * - Trang (HTML/RSC), /api/* khác và ảnh từ vựng (/api/images) luôn lấy từ mạng; mất mạng → trang "Bạn đang offline".
 */
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const YEAR = 60 * 60 * 24 * 365;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/audio/"),
      handler: new CacheFirst({
        cacheName: "lesson-audio",
        plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: YEAR })],
      }),
    },
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/hanzi/"),
      handler: new CacheFirst({
        cacheName: "hanzi-data",
        plugins: [new ExpirationPlugin({ maxEntries: 2000, maxAgeSeconds: YEAR })],
      }),
    },
    {
      // Chỉ ảnh công khai (logo, mascot, icon) — không bao giờ cache ảnh từ vựng của người dùng.
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname.startsWith("/brand/") ||
          url.pathname.startsWith("/icons/") ||
          (url.pathname === "/_next/image" && /^\/(brand|icons)\//.test(url.searchParams.get("url") ?? ""))),
      handler: new StaleWhileRevalidate({
        cacheName: "public-images",
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: YEAR })],
      }),
    },
    {
      // Font tự host (chia nhỏ theo unicode-range) — cache dần theo chữ đã hiển thị, không precache ~1.800 file.
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/media/"),
      handler: new CacheFirst({
        cacheName: "fonts",
        plugins: [new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: YEAR })],
      }),
    },
    { matcher: ({ request }) => request.mode === "navigate", handler: new NetworkOnly() },
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
