/** Đổi trạng thái nhiều câu. POST { ids, status: "learned" | "review" } → { updated }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { setSentenceStatus } from "@/features/sentences/service";
import { idsSchema } from "../_ids";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user, req }) => {
  const { ids, status } = z.object({ ids: idsSchema, status: z.enum(["review", "learned"]) }).parse(await body(req));
  const updated = await setSentenceStatus(user.id, ids, status);
  revalidatePath("/sentences", "layout");
  return { updated };
});
