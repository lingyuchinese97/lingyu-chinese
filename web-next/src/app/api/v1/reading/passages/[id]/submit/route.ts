/** Nộp bài: `{ answers: (số thứ tự lựa chọn | chữ điền | null)[], durationSec }` → kết quả (server chấm) + đáp án. */
import { api, body } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { submitSchema } from "@/features/reading/schema";
import { submitReading } from "@/features/reading/service";

export const dynamic = "force-dynamic";
type P = { id: string };

export const POST = api<P>(async ({ user, req, params }) => {
  const i = submitSchema.parse(await body(req));
  return submitReading(user.id, params.id, i.answers, i.durationSec, await getLocale());
});
