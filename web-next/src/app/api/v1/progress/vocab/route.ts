/** Tiến độ từ vựng theo cấp HSK (từ HSK đã thuộc / trong kho / tổng số từ của cấp) và theo thẻ của mình. */
import { api } from "@/server/api";
import { vocabByHsk, vocabByTag } from "@/features/progress/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [hsk, tags] = await Promise.all([vocabByHsk(user.id), vocabByTag(user.id)]);
  return { hsk, tags };
});
