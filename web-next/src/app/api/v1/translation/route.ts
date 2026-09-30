/**
 * Luyện dịch — thông tin để tạo bài: trình độ ước lượng (HSK 1–4), điểm ngữ pháp, chủ đề, số câu, bài đang làm, lịch sử gần đây.
 */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { T_TOPICS } from "@/data/translation/items";
import { T_COUNTS } from "@/features/translation/schema";
import {
  estimateLevel,
  getActiveTranslation,
  localGrammar,
  myGrammarForTranslation,
  translationHistory,
} from "@/features/translation/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => {
  const [level, active, history, myGrammar] = await Promise.all([
    estimateLevel(user.id),
    getActiveTranslation(user.id),
    translationHistory(user.id, 10),
    myGrammarForTranslation(user.id),
  ]);
  return {
    level,
    grammar: localGrammar(await getLocale()),
    myGrammar,
    topics: T_TOPICS,
    counts: T_COUNTS,
    active: active
      ? { id: active.id, done: active.questions.filter((q) => q.answered).length, total: active.total }
      : null,
    history,
  };
});
