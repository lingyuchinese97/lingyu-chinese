/** Admin: từ trong Thư viện LingYu. GET ?q&status(all|draft|public)&page · POST { word, publish } → 201 { id }. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { adminLibListSchema, libWordInputSchema } from "@/features/library/schema";
import { adminListWords, createWord } from "@/features/library/service";
import { assertAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => {
  assertAdmin(user);
  return adminListWords(adminLibListSchema.parse(query(req)));
});
export const POST = api(
  async ({ user, req }) => {
    assertAdmin(user);
    const { word, publish } = z
      .object({ word: libWordInputSchema, publish: z.boolean().default(false) })
      .parse(await body(req));
    const id = await createWord(user.id, word, publish);
    revalidatePath("/library/vocabulary");
    return { id };
  },
  { status: 201 },
);
