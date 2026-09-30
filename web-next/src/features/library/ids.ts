import { z } from "zod";
import { LibraryError } from "./service";

/** id từ trên URL: không phải uuid → 404 (như từ không tồn tại). */
export function wordId(id: string) {
  const r = z.uuid().safeParse(id);
  if (!r.success) throw new LibraryError("not-found", "Không tìm thấy từ này trong thư viện.");
  return r.data;
}
