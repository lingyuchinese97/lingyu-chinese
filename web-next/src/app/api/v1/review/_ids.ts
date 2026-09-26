import { z } from "zod";
import { ReviewError } from "@/features/review/service";

export type P = { id: string };

/** id phiên không hợp lệ → 404 như phiên không tồn tại / của người khác. */
export function sid(id: string) {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new ReviewError("not-found", "Bài ôn tập không còn tồn tại.");
  return r.data;
}
