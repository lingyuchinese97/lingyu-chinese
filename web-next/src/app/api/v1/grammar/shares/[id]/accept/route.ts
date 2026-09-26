/** Chấp nhận lời mời: tạo bản riêng trong thư viện của mình. POST { keepTags?, extraTags? } → { id, title }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { grammarTagName } from "@/features/grammar/schema";
import { acceptShare } from "@/features/grammar/service";
import { gid, SHARE_GONE } from "../../../_id";

export const dynamic = "force-dynamic";

export const POST = api<{ id: string }>(async ({ user, req, params }) => {
  const o = z
    .object({ keepTags: z.boolean().default(true), extraTags: z.array(grammarTagName).max(20).default([]) })
    .parse(await body(req));
  const r = await acceptShare(user, gid(params.id, SHARE_GONE), o);
  revalidatePath("/grammar", "layout");
  return r;
});
