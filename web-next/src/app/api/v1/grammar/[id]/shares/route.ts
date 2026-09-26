/** Chia sẻ một ngữ pháp của mình. GET: đã gửi cho ai (trạng thái) · POST { emails }: gửi lời mời → kết quả từng email. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { getOwnGrammar, GrammarError, listSent, shareGrammar } from "@/features/grammar/service";
import { getT } from "@/i18n/server";
import { gid } from "../../_id";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = api<P>(async ({ user, params }) => {
  const id = gid(params.id);
  if (!(await getOwnGrammar(user.id, id))) throw new GrammarError("not-found", "Không tìm thấy ngữ pháp này.");
  return listSent(user.id, id);
});

export const POST = api<P>(async ({ user, req, params }) => {
  const { emails } = z
    .object({ emails: z.array(z.string().max(254)).min(1, "Vui lòng nhập ít nhất 1 email người nhận.").max(50) })
    .parse(await body(req));
  const r = await shareGrammar(user, gid(params.id), emails);
  revalidatePath("/grammar", "layout");
  const t = await getT();
  return { ...r, results: r.results.map((x) => ({ ...x, message: t.maybe(x.message) })) };
});
