import type { MetadataRoute } from "next";

/** Web App Manifest — cài LingYu lên màn hình chính như một ứng dụng. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LingYu Chinese",
    short_name: "LingYu",
    description: "Tiếng Trung gần hơn mỗi ngày — từ vựng, ngữ pháp, bộ thủ, ôn tập và bài học.",
    lang: "vi",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6FBFF",
    theme_color: "#F6FBFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
