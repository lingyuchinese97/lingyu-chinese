/** Trả lời một câu: `{ index, answer }` → phiên đã chấm (câu vừa làm có `reveal`). */
import { api, body } from "@/server/api";
import { answerSchema } from "@/features/review/schema";
import { checkAnswer } from "@/features/review/service";
import { sid, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = answerSchema.omit({ sessionId: true });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sid(params.id);
  const { index, answer } = schema.parse(await body(req));
  return checkAnswer(user.id, id, index, answer);
});
