/** Tìm kiếm chung (ô tìm kiếm trên cùng): từ vựng, ngữ pháp, câu của mình + bài học, bộ thủ (nội dung chung). */
import { listVocab } from "@/features/vocabulary/service";
import { listGrammar } from "@/features/grammar/service";
import { listSentences } from "@/features/sentences/service";
import { listParamsSchema } from "@/features/vocabulary/schema";
import { grammarListSchema } from "@/features/grammar/schema";
import { sentenceListSchema } from "@/features/sentences/schema";
import { LESSONS, localizeLesson } from "@/data/lessons";
import { searchRadicals } from "@/lib/radicals";
import { fold } from "@/lib/fold";
import type { Locale } from "@/i18n/config";

export type SearchResult = {
  vocab: { id: string; hanzi: string; pinyin: string; meaningVi: string }[];
  grammar: { id: string; title: string; meaning: string }[];
  sentences: { id: string; chinese: string; vietnamese: string }[];
  lessons: { id: string; title: string; subtitle: string }[];
  radicals: { num: number; char: string; name: string; meaning: string }[];
  total: number;
};

export async function search(userId: string, q: string, locale: Locale = "vi", limit = 5): Promise<SearchResult> {
  const query = q.trim().slice(0, 100);
  if (!query) return { vocab: [], grammar: [], sentences: [], lessons: [], radicals: [], total: 0 };
  const [v, g, s] = await Promise.all([
    listVocab(userId, listParamsSchema.parse({ q: query }), limit),
    listGrammar(userId, grammarListSchema.parse({ q: query })),
    listSentences(userId, sentenceListSchema.parse({ q: query }), limit),
  ]);
  const f = fold(query);
  const lessons = LESSONS.map((l) => localizeLesson(l, locale))
    .filter((l) => fold(`${l.title} ${l.subtitle} ${l.badge}`).includes(f))
    .slice(0, limit)
    .map((l) => ({ id: l.id, title: l.title, subtitle: l.subtitle }));
  // Bộ thủ: chỉ khi gõ ngắn (1 chữ Hán, số bộ, tên bộ) để không lẫn kết quả.
  const radicals =
    [...query].length <= 6
      ? searchRadicals(query)
          .slice(0, 3)
          .map((r) => ({
            num: r.num,
            char: r.char,
            name: locale === "en" ? r.pinyin : r.name,
            meaning: locale === "en" ? r.meaningEn : r.meaning,
          }))
      : [];
  const res = {
    vocab: v.items.slice(0, limit).map((x) => ({ id: x.id, hanzi: x.hanzi, pinyin: x.pinyin, meaningVi: x.meaningVi })),
    grammar: g.items.slice(0, limit).map((x) => ({ id: x.id, title: x.title, meaning: x.meaning })),
    sentences: s.items.slice(0, limit).map((x) => ({ id: x.id, chinese: x.chinese, vietnamese: x.vietnamese })),
    lessons,
    radicals,
  };
  return { ...res, total: Object.values(res).reduce((n, a) => n + a.length, 0) };
}
