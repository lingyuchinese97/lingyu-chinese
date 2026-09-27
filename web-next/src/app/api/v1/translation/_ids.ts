import { z } from "zod";
import { TranslationError } from "@/features/translation/service";
import { elapsedSchema } from "@/features/translation/schema";

export type P = { id: string };
/** id bài sai dạng → 404 như bài không còn. */
export function sessId(id: string) {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new TranslationError("not-found", "Bài luyện dịch không còn tồn tại. Hãy tạo bài mới.");
  return r.data;
}
export const indexSchema = z.number().int().min(0).max(49);
export const elapsed = elapsedSchema.optional();
