/** Một bộ từ vựng: danh sách từ kèm đã học / yêu thích / đã có trong Từ vựng của tôi (theo người xem). Không có → 404. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { getSet } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const GET = api<{ id: string }>(async ({ user, params }) =>
  getSet(user.id, setIdSchema.parse(params.id), await getLocale()),
);
