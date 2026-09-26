/** Gắn thêm tag cho nhiều từ (tag cũ giữ nguyên). POST { ids, tags } → { updated }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { idsSchema, tagNameSchema } from "@/features/vocabulary/schema";
import { addTags } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const { ids, tags } = z
    .object({ ids: idsSchema, tags: z.array(tagNameSchema).min(1, "Vui lòng chọn ít nhất 1 tag.").max(20) })
    .parse(await body(req));
  const updated = await addTags(user.id, ids, tags);
  revalidatePath("/vocabulary");
  return { updated };
});
