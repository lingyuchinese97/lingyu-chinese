"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, adminOrThrow } from "@/server/session";
import { log } from "@/server/log";
import { resetUserPassword, setUserDisabled } from "@/server/users";
import { getUser } from "./service";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

async function target(admin: { id: string }, id: string) {
  const u = await getUser(z.uuid().parse(id));
  if (!u) throw new Error("not-found");
  if (u.id === admin.id) throw new Error("self");
  return u;
}
function fail(e: unknown): { ok: false; message: string } {
  if (e instanceof AuthError) return { ok: false, message: e.message };
  if (e instanceof Error && e.message === "self")
    return { ok: false, message: "Không thể thực hiện thao tác này với chính tài khoản của bạn." };
  if (e instanceof Error && e.message === "not-found") return { ok: false, message: "Không tìm thấy người dùng." };
  if (e instanceof z.ZodError) return { ok: false, message: "Dữ liệu không hợp lệ." };
  log.error({ err: e instanceof Error ? e.message : String(e) }, "admin action failed");
  return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

/** Sinh mật khẩu tạm (hiển thị 1 lần) và đăng xuất mọi phiên của người đó. */
export async function resetPasswordAction(userId: string): Promise<Result<{ email: string; password: string }>> {
  try {
    const admin = await adminOrThrow();
    const u = await target(admin, userId);
    const password = await resetUserPassword(u.id);
    log.info({ adminId: admin.id, userId: u.id }, "admin reset password");
    return { ok: true, email: u.email, password };
  } catch (e) {
    return fail(e);
  }
}

export async function setDisabledAction(userId: string, disabled: boolean): Promise<Result> {
  try {
    const admin = await adminOrThrow();
    const u = await target(admin, userId);
    await setUserDisabled(u.id, z.boolean().parse(disabled));
    log.info({ adminId: admin.id, userId: u.id, disabled }, "admin set disabled");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
