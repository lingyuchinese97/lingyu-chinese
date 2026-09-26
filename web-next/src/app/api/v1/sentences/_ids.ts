import { z } from "zod";
import { SentenceError } from "@/features/sentences/service";
import { SentenceReviewError } from "@/features/sentences/review-service";

export type P = { id: string };
/** id câu sai dạng → 404 như không có. */
export function sentId(id: string) {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new SentenceError("not-found", "Không tìm thấy câu này. Có thể nó đã bị xóa.");
  return r.data;
}
/** id phiên ôn sai dạng → 404 như phiên không còn. */
export function sessId(id: string) {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new SentenceReviewError("not-found", "Bài ôn không còn tồn tại. Hãy tạo bài mới.");
  return r.data;
}
export const idsSchema = z.array(z.uuid()).min(1, "Chưa chọn câu nào.").max(500);
export const indexSchema = z.number().int().min(0).max(499);
