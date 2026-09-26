/** Một thẻ ngữ pháp. PUT { name }: đổi tên · DELETE: xoá thẻ (ngữ pháp giữ nguyên). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { grammarTagName } from "@/features/grammar/schema";
import { deleteGrammarTag, renameGrammarTag } from "@/features/grammar/service";
import { gid } from "../../_id";

export const dynamic = "force-dynamic";
type P = { id: string };
const tid = (id: string) => gid(id, "Không tìm thấy thẻ.");

export const PUT = api<P>(async ({ user, req, params }) => {
  const { name } = z.object({ name: grammarTagName }).parse(await body(req));
  await renameGrammarTag(user.id, tid(params.id), name);
  revalidatePath("/grammar", "layout");
  return { id: params.id, name };
});

export const DELETE = api<P>(async ({ user, params }) => {
  await deleteGrammarTag(user.id, tid(params.id));
  revalidatePath("/grammar", "layout");
  return { deleted: true };
});
