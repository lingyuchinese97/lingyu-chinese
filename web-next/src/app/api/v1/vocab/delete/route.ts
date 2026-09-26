/** Xoá nhiều từ. POST { ids } → { removed } (id không phải của mình bị bỏ qua). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { idsSchema } from "@/features/vocabulary/schema";
import { deleteVocab } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const { ids } = z.object({ ids: idsSchema }).parse(await body(req));
  const removed = await deleteVocab(user.id, ids);
  revalidatePath("/vocabulary");
  return { removed };
});
