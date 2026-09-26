"use client";
import * as React from "react";

const INTERVAL = 60_000;
const IDLE = 120_000;
const FIRST = 5_000;

/**
 * Đếm thời gian học: mỗi phút báo "đang học" cho server (`POST /api/v1/progress/ping`) khi trang đang hiển thị và
 * người dùng có thao tác trong 2 phút gần nhất. Server tự giới hạn (tối đa 60 giây mỗi nhịp) nên gửi thừa cũng không sao.
 */
export function StudyTimer() {
  React.useEffect(() => {
    let last = Date.now();
    const active = () => (last = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, active, { passive: true });
    const send = () => {
      if (document.visibilityState !== "visible" || Date.now() - last > IDLE) return;
      void fetch("/api/v1/progress/ping", { method: "POST" }).catch(() => undefined);
    };
    // Nhịp đầu gửi sau vài giây (không gửi ngay lúc tải trang, tránh đua với service worker đang nhận quyền điều khiển).
    const first = window.setTimeout(send, FIRST);
    const id = window.setInterval(send, INTERVAL);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      for (const e of events) window.removeEventListener(e, active);
    };
  }, []);
  return null;
}
