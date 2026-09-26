/** Xoá nhiều câu. POST { ids } → { removed } (id không phải của mình bị bỏ qua). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { deleteSentences } from "@/features/sentences/service";
import { idsSchema } from "../_ids";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user, req }) => {
  const { ids } = z.object({ ids: idsSchema }).parse(await body(req));
  const removed = await deleteSentences(user.id, ids);
  revalidatePath("/sentences", "layout");
  return { removed };
});
