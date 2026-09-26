import { z } from "zod";
import { GrammarError } from "@/features/grammar/service";

/** id trong đường dẫn phải là uuid; sai dạng → 404 như không có. */
export function gid(id: string, message = "Không tìm thấy ngữ pháp này. Có thể nó đã bị xóa.") {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new GrammarError("not-found", message);
  return r.data;
}
export const SHARE_GONE = "Lời mời chia sẻ không còn tồn tại.";
