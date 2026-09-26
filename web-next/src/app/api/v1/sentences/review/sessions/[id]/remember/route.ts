/** Sau khi trả lời: `{ index, remembered }` — nhớ → câu thành “Đã thuộc”, chưa nhớ → “Cần ôn”. → phiên. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { rememberSentence } from "@/features/sentences/review-service";
import { indexSchema, sessId, type P } from "../../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema, remembered: z.boolean() });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return ((i) => rememberSentence(user.id, id, i.index, i.remembered))(schema.parse(await body(req)));
});
