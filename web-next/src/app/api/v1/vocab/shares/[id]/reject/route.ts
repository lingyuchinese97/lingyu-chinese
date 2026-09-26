/** Từ chối lời mời chia sẻ. POST. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api } from "@/server/api";
import { VocabError } from "@/features/vocabulary/service";
import { rejectVocabShare } from "@/features/vocabulary/share-service";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, params }) => {
  const id = z.uuid().safeParse(params.id);
  if (!id.success) throw new VocabError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  await rejectVocabShare(user, id.data);
  revalidatePath("/vocabulary");
  return { rejected: true };
});
