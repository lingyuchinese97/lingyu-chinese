/** Nộp bài: `{ elapsedSec? }` → bài đã xong (đủ lời giải). Chưa làm hết → 400. Ghi vào Tiến độ học tập. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { completeTranslation } from "@/features/translation/service";
import { elapsed, sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ elapsedSec: elapsed });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return completeTranslation(user.id, id, schema.parse(await body(req)).elapsedSec);
});
