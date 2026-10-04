/** Admin: ảnh minh hoạ. PUT { data: base64 } (JPG/PNG/WebP ≤ 1MB, kiểm tra magic bytes) · DELETE (xoá ảnh). */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { parseLibImage, setWordImage } from "@/features/library/service";
import { assertAdmin } from "../../../../_guard";
import { wordId as wid } from "@/features/library/ids";

export const dynamic = "force-dynamic";
type P = { id: string };
export const PUT = api<P>(async ({ user, req, params }) => {
  assertAdmin(user);
  const { data } = z.object({ data: z.string().max(1_500_000) }).parse(await body(req));
  const r = await setWordImage(wid(params.id), parseLibImage(Buffer.from(data, "base64")));
  revalidatePath("/library/words");
  return r;
});
export const DELETE = api<P>(async ({ user, params }) => {
  assertAdmin(user);
  const r = await setWordImage(wid(params.id), null);
  revalidatePath("/library/words");
  return r;
});
