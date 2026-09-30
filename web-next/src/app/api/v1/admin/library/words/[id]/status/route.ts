/** Admin: public / về nháp. POST { public } (public cần có pinyin + nghĩa). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { setWordStatus } from "@/features/library/service";
import { assertAdmin } from "../../../../_guard";
import { wordId as wid } from "@/features/library/ids";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, req, params }) => {
  assertAdmin(user);
  const { public: isPublic } = z.object({ public: z.boolean() }).parse(await body(req));
  const r = await setWordStatus(wid(params.id), isPublic);
  revalidatePath("/library/vocabulary");
  return r;
});
