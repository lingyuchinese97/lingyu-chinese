/** Đánh dấu đã thuộc / bỏ đánh dấu một bộ thủ. PUT { known: boolean } → { known }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { setKnown } from "@/features/radicals/service";
import { radicalOrThrow } from "../../_num";

export const dynamic = "force-dynamic";

export const PUT = api<{ num: string }>(async ({ user, req, params }) => {
  const r = radicalOrThrow(params.num);
  const { known } = z.object({ known: z.boolean() }).parse(await body(req));
  const v = await setKnown(user.id, r.num, known);
  revalidatePath("/radicals", "layout");
  return { known: v };
});
