/** Bỏ qua câu: `{ index, elapsedSec? }`. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { skipTranslation } from "@/features/translation/service";
import { elapsed, indexSchema, sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema, elapsedSec: elapsed });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  const i = schema.parse(await body(req));
  return skipTranslation(user.id, id, i.index, i.elapsedSec);
});
