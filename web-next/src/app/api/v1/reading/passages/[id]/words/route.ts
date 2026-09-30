/** Lưu từ khoá của bài vào kho Từ vựng (bỏ qua từ đã có): `{ words?: string[] }` (bỏ trống = tất cả) → `{ added, skipped }`. */
import { api, body } from "@/server/api";
import { saveWordsSchema } from "@/features/reading/schema";
import { saveWords } from "@/features/reading/service";

export const dynamic = "force-dynamic";
type P = { id: string };

export const POST = api<P>(async ({ user, req, params }) =>
  saveWords(user.id, params.id, saveWordsSchema.parse(await body(req)).words),
);
