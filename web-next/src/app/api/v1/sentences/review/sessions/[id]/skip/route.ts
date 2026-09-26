/** Bỏ qua một câu: `{ index }` → phiên. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { skipSentence } from "@/features/sentences/review-service";
import { indexSchema, sessId, type P } from "../../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({ index: indexSchema });

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sessId(params.id);
  return ((i) => skipSentence(user.id, id, i.index))(schema.parse(await body(req)));
});
