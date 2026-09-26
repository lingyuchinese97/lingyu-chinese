/** Một bộ thủ (1–214): thông tin, chữ ví dụ, đã thuộc chưa. */
import { api } from "@/server/api";
import { radicalExamples } from "@/lib/radicals";
import { isKnown } from "@/features/radicals/service";
import { radicalOrThrow } from "../_num";

export const dynamic = "force-dynamic";

export const GET = api<{ num: string }>(async ({ user, params }) => {
  const r = radicalOrThrow(params.num);
  return { ...r, examples: radicalExamples(r.num), known: await isKnown(user.id, r.num) };
});
