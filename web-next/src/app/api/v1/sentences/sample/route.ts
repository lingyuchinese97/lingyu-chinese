/** Thêm bộ câu mẫu (bỏ qua câu trùng). POST → { added }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { importSampleSentences } from "@/features/sentences/service";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user }) => {
  const added = await importSampleSentences(user.id);
  revalidatePath("/sentences", "layout");
  return { added };
});
