/** Lưu thời gian làm bài (khi tạm dừng): `{ elapsedSec }` → `{ elapsedSec }` (không giảm, tối đa 6 giờ). */
import { z } from "zod";
import { api, body } from "@/server/api";
import { saveTranslationTime } from "@/features/translation/service";
import { elapsedSchema } from "@/features/translation/schema";
import { sessId, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ elapsedSec: elapsedSchema });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return saveTranslationTime(user.id, id, schema.parse(await body(req)).elapsedSec);
});
