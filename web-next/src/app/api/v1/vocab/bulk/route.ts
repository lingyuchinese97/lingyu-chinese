/** Thêm nhiều từ một lần (vd từ ảnh). POST { items: VocabInput[] } → { added, skipped } (bỏ qua từ đã có). */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { bulkSchema } from "@/features/vocabulary/schema";
import { createMany } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => {
  const r = await createMany(user.id, bulkSchema.parse(await body(req)).items);
  revalidatePath("/vocabulary");
  return r;
});
