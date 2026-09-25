"use client";
import { SerwistProvider } from "@serwist/turbopack/react";

/** Đăng ký service worker (chỉ bản production, để dev không bị cache). */
export function Pwa({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"} reloadOnOnline={false}>
      {children}
    </SerwistProvider>
  );
}
