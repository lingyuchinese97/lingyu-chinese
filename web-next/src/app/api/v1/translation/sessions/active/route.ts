/** Bài đang làm (hoặc `null`); DELETE = bỏ bài đang làm. */
import { api } from "@/server/api";
import { abandonTranslation, getActiveTranslation } from "@/features/translation/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getActiveTranslation(user.id));
export const DELETE = api(async ({ user }) => {
  await abandonTranslation(user.id);
  return { abandoned: true };
});
