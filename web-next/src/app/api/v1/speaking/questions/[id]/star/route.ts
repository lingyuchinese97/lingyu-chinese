/** PUT { starred } → đánh dấu / bỏ đánh dấu câu hỏi. */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { starSchema } from "@/features/speaking/schema";
import { setStarred } from "@/features/speaking/service";
import { qid, type P } from "../../../ids";

export const dynamic = "force-dynamic";
export const PUT = api<P>(async ({ user, req, params }) => {
  const r = await setStarred(user.id, qid(params.id), starSchema.parse(await body(req)).starred);
  revalidatePath("/speaking", "layout");
  return r;
});
