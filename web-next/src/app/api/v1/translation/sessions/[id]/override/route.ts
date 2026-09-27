/** Tính là đúng (câu đang bị chấm sai): `{ index }`. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { overrideTranslation } from "@/features/translation/service";
import { indexSchema, sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return overrideTranslation(user.id, id, schema.parse(await body(req)).index);
});
