import pino from "pino";
import { env } from "@/env";

/**
 * Log JSON ra stdout (Vercel và Docker đều đọc được).
 * Không bao giờ log mật khẩu, cookie, nội dung ảnh — các khoá này bị che nếu lỡ truyền vào.
 */
export const log = pino({
  level: env.LOG_LEVEL,
  base: { app: "lingyu" },
  redact: {
    paths: [
      "password",
      "*.password",
      "newPassword",
      "*.newPassword",
      "currentPassword",
      "cookie",
      "*.cookie",
      "headers.cookie",
      "data",
      "*.data",
      "token",
      "*.token",
    ],
    censor: "[redacted]",
  },
});
