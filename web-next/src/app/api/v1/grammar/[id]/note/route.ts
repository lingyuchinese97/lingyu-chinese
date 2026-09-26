/** Ghi chú cá nhân của ngữ pháp (chỉ chủ sở hữu; không bao giờ chia sẻ). PUT { content } — rỗng = xoá. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { G_LIMITS } from "@/features/grammar/schema";
import { savePersonalNote } from "@/features/grammar/service";
import { gid } from "../../_id";

export const dynamic = "force-dynamic";

export const PUT = api<{ id: string }>(async ({ user, req, params }) => {
  const { content } = z
    .object({
      content: z.string().max(G_LIMITS.personalNote, `Tối đa ${G_LIMITS.personalNote} ký tự.`),
    })
    .parse(await body(req));
  const saved = await savePersonalNote(user.id, gid(params.id), content);
  revalidatePath("/grammar", "layout");
  return { personalNote: saved };
});
