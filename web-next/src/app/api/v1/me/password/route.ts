/** Đổi mật khẩu: POST { current, password } — các thiết bị khác bị đăng xuất, phiên đang dùng được giữ. → { changed: true }. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { getSession } from "@/server/session";
import { passwordSchema } from "@/lib/auth-rules";
import { changePassword } from "@/features/account/service";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user, req }) => {
  const { current, password } = z
    .object({
      current: z.string({ error: "Vui lòng nhập mật khẩu hiện tại." }).min(1, "Vui lòng nhập mật khẩu hiện tại."),
      password: passwordSchema,
    })
    .parse(await body(req));
  const s = await getSession();
  await changePassword(user.id, s!.sessionId, current, password);
  return { changed: true };
});
