/** Các tag từ vựng của mình kèm số từ. GET · POST { name } (tạo tag; đã có → trả tag cũ). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { tagNameSchema } from "@/features/vocabulary/schema";
import { createTag, listTags } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => listTags(user.id));

export const POST = api(async ({ user, req }) => {
  const { name } = z.object({ name: tagNameSchema }).parse(await body(req));
  const id = await createTag(user.id, name);
  revalidatePath("/vocabulary");
  return (await listTags(user.id)).find((t) => t.id === id)!;
});
