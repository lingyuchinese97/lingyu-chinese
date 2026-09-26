/** Chấp nhận lời mời: chép các từ vào kho của mình. POST { keepTags?, extraTags? } → { added, skipped, total }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { tagNameSchema } from "@/features/vocabulary/schema";
import { VocabError } from "@/features/vocabulary/service";
import { acceptVocabShare } from "@/features/vocabulary/share-service";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, req, params }) => {
  const id = z.uuid().safeParse(params.id);
  if (!id.success) throw new VocabError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  const o = z
    .object({ keepTags: z.boolean().default(true), extraTags: z.array(tagNameSchema).max(20).default([]) })
    .parse(await body(req));
  const r = await acceptVocabShare(user, id.data, o);
  revalidatePath("/vocabulary");
  return r;
});
