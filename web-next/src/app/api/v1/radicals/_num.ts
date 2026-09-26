import { ApiError } from "@/server/api";
import { radicalByNum } from "@/lib/radicals";

/** Số bộ thủ 1–214 trong đường dẫn; sai → 404. */
export function radicalOrThrow(num: string) {
  const r = /^\d{1,3}$/.test(num) ? radicalByNum(Number(num)) : null;
  if (!r) throw new ApiError(404, "Không tìm thấy bộ thủ này.");
  return r;
}
