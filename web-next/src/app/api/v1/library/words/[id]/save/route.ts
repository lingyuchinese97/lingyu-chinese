/** Lưu từ thư viện vào Từ vựng của tôi (đã có Hán tự đó → bỏ qua). POST → { saved, added }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { saveToMyVocab } from "@/features/library/service";
import { wordId as wid } from "@/features/library/ids";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, params }) => {
  const r = await saveToMyVocab(user.id, wid(params.id));
  revalidatePath("/vocabulary");
  return r;
});
