import { z } from "zod";
import { SpeakingError } from "@/features/speaking/service";

export type P = { id: string };
/** id câu hỏi phải là UUID — không hợp lệ thì coi như không có (404). */
export const qid = (id: string) => {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new SpeakingError("not-found", "Không tìm thấy câu hỏi này.");
  return r.data;
};
