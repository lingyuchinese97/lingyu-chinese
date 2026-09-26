/** Thêm bộ ngữ pháp mẫu (bỏ qua bài trùng tiêu đề). POST → { added }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { importSampleGrammar } from "@/features/grammar/service";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user }) => {
  const added = await importSampleGrammar(user.id);
  revalidatePath("/grammar", "layout");
  return { added };
});
