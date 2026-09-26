/** Trả lời một câu: `{ index, answer }` → phiên đã chấm. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { answerSentence } from "@/features/sentences/review-service";
import { indexSchema, sessId, type P } from "../../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema, answer: z.string().max(400) });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return ((i) => answerSentence(user.id, id, i.index, i.answer))(schema.parse(await body(req)));
});
