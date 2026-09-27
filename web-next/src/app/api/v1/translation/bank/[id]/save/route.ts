/** Lưu câu mẫu vào Kho câu của tôi (tag "Luyện dịch" + cấp HSK) → 201 `{ id }`. Đã có → 409. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { saveItemToBank } from "@/features/translation/service";
import type { P } from "../../../_ids";

export const dynamic = "force-dynamic";

export const POST = api<P>(async ({ user, params }) => saveItemToBank(user.id, params.id, await getLocale()), {
  status: 201,
});
