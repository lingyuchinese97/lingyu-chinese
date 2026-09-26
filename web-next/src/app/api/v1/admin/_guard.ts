import { AuthError, type SessionUser } from "@/server/session";

/** Chỉ admin (role = "admin") — người dùng thường → 403. */
export function assertAdmin(user: SessionUser) {
  if (user.role !== "admin") throw new AuthError("forbidden");
}
