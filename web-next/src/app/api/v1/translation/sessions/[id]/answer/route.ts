/** Trả lời: `{ index, answer, elapsedSec? }` → bài đã chấm (server chấm; kèm độ giống 0–100 và lời giải). */
import { z } from "zod";
import { api, body } from "@/server/api";
import { answerTranslation } from "@/features/translation/service";
import { elapsed, indexSchema, sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema, answer: z.string().max(1000), elapsedSec: elapsed });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  const i = schema.parse(await body(req));
  return answerTranslation(user.id, id, i.index, i.answer, i.elapsedSec);
});
