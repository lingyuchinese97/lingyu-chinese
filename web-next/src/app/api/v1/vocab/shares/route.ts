/** Chia sẻ từ vựng cho người dùng khác qua email. POST { ids, emails } → kết quả từng email. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { idsSchema } from "@/features/vocabulary/schema";
import { shareVocab } from "@/features/vocabulary/share-service";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const { ids, emails } = z
    .object({
      ids: idsSchema,
      emails: z.array(z.string().max(254)).min(1, "Vui lòng nhập ít nhất 1 email người nhận.").max(50),
    })
    .parse(await body(req));
  const r = await shareVocab(user, ids, emails);
  const t = await getT();
  return { ...r, results: r.results.map((x) => ({ ...x, message: t.maybe(x.message) })) };
});
