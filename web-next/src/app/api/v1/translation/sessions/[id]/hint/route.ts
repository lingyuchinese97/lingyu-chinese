/** Xem gợi ý tiếp theo: `{ index }` — lần 1: từ khoá, lần 2: cấu trúc ngữ pháp. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { hintTranslation } from "@/features/translation/service";
import { indexSchema, sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return hintTranslation(user.id, id, schema.parse(await body(req)).index);
});
