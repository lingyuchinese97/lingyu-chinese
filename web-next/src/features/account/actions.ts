"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/server/auth";
import { AuthError, getSession } from "@/server/session";
import { log } from "@/server/log";
import { nameSchema, passwordSchema } from "@/lib/auth-rules";
import { AccountError, changePassword, removeUser, updateName, verifyPassword } from "./service";

type Result = { ok: true } | { ok: false; message: string; field?: string };

async function me() {
  const s = await getSession();
  if (!s) throw new AuthError("unauthenticated");
  return s;
}
function fail(e: unknown): Result {
  if (e instanceof AccountError) return { ok: false, message: e.message, field: e.field };
  if (e instanceof AuthError) return { ok: false, message: e.message };
  if (e instanceof z.ZodError) return { ok: false, message: e.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  log.error({ err: e instanceof Error ? e.message : String(e) }, "account action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

export async function updateNameAction(name: string): Promise<Result> {
  try {
    const s = await me();
    const r = nameSchema.safeParse(name);
    if (!r.success) return { ok: false, message: r.error.issues[0]!.message, field: "name" };
    await updateName(s.user.id, r.data);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function changePasswordAction(input: {
  current: string;
  password: string;
  confirm: string;
}): Promise<Result> {
  try {
    const s = await me();
    if (!input.current) return { ok: false, message: "Vui lòng nhập mật khẩu hiện tại.", field: "current" };
    const pw = passwordSchema.safeParse(input.password);
    if (!pw.success) return { ok: false, message: pw.error.issues[0]!.message, field: "password" };
    if (input.confirm !== input.password)
      return { ok: false, message: "Mật khẩu xác nhận không khớp.", field: "confirm" };
    await changePassword(s.user.id, s.sessionId, String(input.current), pw.data);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAccountAction(password: string): Promise<Result> {
  try {
    const s = await me();
    if (!password) return { ok: false, message: "Vui lòng nhập mật khẩu để xác nhận.", field: "current" };
    if (!(await verifyPassword(s.user.id, String(password))))
      return { ok: false, message: "Mật khẩu không đúng.", field: "current" };
    // Đăng xuất trước để xoá cookie phiên, rồi xoá tài khoản (mọi dữ liệu xoá theo cascade).
    await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
    await removeUser(s.user.id);
    log.info({ userId: s.user.id }, "account deleted by owner");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
