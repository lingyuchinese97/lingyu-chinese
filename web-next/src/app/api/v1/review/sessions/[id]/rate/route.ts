/** Ôn đến hạn: đánh giá câu trả lời đúng `{ index, rating: 2 (Khó) | 3 (Được) | 4 (Dễ) }`. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { rateAnswer } from "@/features/review/service";
import { sid, type P } from "../../../_ids";

export const dynamic = "force-dynamic";
const schema = z.object({
  index: z.number().int().min(0).max(499),
  rating: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

export const POST = api<P>(async ({ user, req, params }) => {
  const id = sid(params.id);
  const { index, rating } = schema.parse(await body(req));
  return rateAnswer(user.id, id, index, rating);
});
