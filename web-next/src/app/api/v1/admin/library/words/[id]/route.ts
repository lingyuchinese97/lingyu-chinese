/** Admin: một từ thư viện. GET · PUT { word, publish? } · DELETE. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { libWordInputSchema } from "@/features/library/schema";
import { adminGetWord, deleteWord, updateWord } from "@/features/library/service";
import { wordId as wid } from "@/features/library/ids";
import { assertAdmin } from "../../../_guard";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = api<P>(async ({ user, params }) => {
  assertAdmin(user);
  return adminGetWord(wid(params.id));
});
export const PUT = api<P>(async ({ user, req, params }) => {
  assertAdmin(user);
  const id = wid(params.id);
  const { word, publish } = z
    .object({ word: libWordInputSchema, publish: z.boolean().optional() })
    .parse(await body(req));
  await updateWord(id, word, publish);
  revalidatePath("/library/words");
  return adminGetWord(id);
});
export const DELETE = api<P>(async ({ user, params }) => {
  assertAdmin(user);
  const r = await deleteWord(wid(params.id));
  revalidatePath("/library/words");
  return r;
});
