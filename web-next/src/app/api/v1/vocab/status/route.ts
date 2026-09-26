/** Đổi trạng thái nhiều từ. POST { ids, status: "learned" | "review" } → { updated }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { idsSchema, STATUS } from "@/features/vocabulary/schema";
import { setStatus } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const { ids, status } = z.object({ ids: idsSchema, status: z.enum(STATUS) }).parse(await body(req));
  const updated = await setStatus(user.id, ids, status);
  revalidatePath("/vocabulary");
  return { updated };
});
