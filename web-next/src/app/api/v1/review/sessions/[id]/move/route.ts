/** Chuyển tới câu `{ index }` (không vượt quá câu chưa làm đầu tiên) → `{ index }` thực tế. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { moveTo } from "@/features/review/service";
import { sid, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: z.number().int().min(0).max(499) });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sid(params.id);
  const { index } = schema.parse(await body(req));
  return { index: await moveTo(user.id, id, index) };
});
