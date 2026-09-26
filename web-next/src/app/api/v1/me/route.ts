/**
 * Tài khoản của tôi. GET: hồ sơ · PUT { name }: đổi tên · DELETE { password }: xoá tài khoản và toàn bộ dữ liệu
 * (cần đúng mật khẩu; không hoàn tác được).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { auth } from "@/server/auth";
import { log } from "@/server/log";
import { nameSchema } from "@/lib/auth-rules";
import { AccountError, removeUser, updateName, verifyPassword } from "@/features/account/service";
import { DEFAULT_LOCALE } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  locale: user.locale ?? DEFAULT_LOCALE,
}));

export const PUT = api(async ({ user, req }) => {
  const { name } = z.object({ name: nameSchema }).parse(await body(req));
  await updateName(user.id, name);
  revalidatePath("/", "layout");
  return { name };
});

export const DELETE = api(async ({ user, req }) => {
  const { password } = z
    .object({
      password: z
        .string({ error: "Vui lòng nhập mật khẩu để xác nhận." })
        .min(1, "Vui lòng nhập mật khẩu để xác nhận."),
    })
    .parse(await body(req));
  if (!(await verifyPassword(user.id, password))) throw new AccountError("Mật khẩu không đúng.", "current");
  await auth.api.signOut({ headers: req.headers }).catch(() => undefined);
  await removeUser(user.id);
  log.info({ userId: user.id }, "account deleted by owner (api)");
  return { deleted: true };
});
