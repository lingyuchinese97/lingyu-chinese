import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

/** Phiên hiện tại (cache trong 1 request). Null nếu chưa đăng nhập hoặc tài khoản bị khoá. */
export const getSession = cache(async (): Promise<{ user: SessionUser } | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: string; disabledAt?: Date | null };
  if (u.disabledAt) return null;
  return { user: { id: u.id, name: u.name, email: u.email, role: u.role === "admin" ? "admin" : "user" } };
});

/** Dùng trong Server Component / layout: chưa đăng nhập → chuyển tới /login. */
export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s.user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/home");
  return u;
}

/** Dùng trong Server Action / route handler: ném lỗi thay vì redirect. */
export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(
      code === "unauthenticated"
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : "Bạn không có quyền thực hiện thao tác này.",
    );
  }
}
export async function currentUserOrThrow(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new AuthError("unauthenticated");
  return s.user;
}
export async function adminOrThrow(): Promise<SessionUser> {
  const u = await currentUserOrThrow();
  if (u.role !== "admin") throw new AuthError("forbidden");
  return u;
}
