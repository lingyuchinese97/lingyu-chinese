/** Thêm bộ từ vựng mẫu (bỏ qua từ đã có). POST → { added }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { importSample } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user }) => {
  const added = await importSample(user.id);
  revalidatePath("/vocabulary");
  return { added };
});
