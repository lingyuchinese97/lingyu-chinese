/** Lưu / bỏ lưu ngữ pháp (đánh dấu). PUT { saved: boolean } → { saved }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { setBookmark } from "@/features/grammar/service";
import { gid } from "../../_id";

export const dynamic = "force-dynamic";

export const PUT = api<{ id: string }>(async ({ user, req, params }) => {
  const { saved } = z.object({ saved: z.boolean() }).parse(await body(req));
  const r = await setBookmark(user.id, gid(params.id), saved);
  revalidatePath("/grammar", "layout");
  return { saved: r };
});
