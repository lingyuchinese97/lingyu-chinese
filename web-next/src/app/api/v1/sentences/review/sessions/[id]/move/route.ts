/** Chuyển tới câu: `{ index }` → `{ index }` thực tế (không vượt quá câu chưa làm đầu tiên). */
import { z } from "zod";
import { api, body } from "@/server/api";
import { moveSentenceTo } from "@/features/sentences/review-service";
import { indexSchema, sessId, type P } from "../../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return (async (i) => ({ index: await moveSentenceTo(user.id, id, i.index) }))(schema.parse(await body(req)));
});
