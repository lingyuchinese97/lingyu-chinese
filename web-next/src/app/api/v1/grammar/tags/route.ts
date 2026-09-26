/** Thẻ ngữ pháp của tôi. GET: thẻ + số ngữ pháp · POST { name }: tạo thẻ (trùng tên → 409). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { grammarTagName } from "@/features/grammar/schema";
import { createGrammarTag, listGrammarTags } from "@/features/grammar/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => listGrammarTags(user.id));

export const POST = api(
  async ({ user, req }) => {
    const { name } = z.object({ name: grammarTagName }).parse(await body(req));
    const r = await createGrammarTag(user.id, name);
    revalidatePath("/grammar", "layout");
    return r;
  },
  { status: 201 },
);
