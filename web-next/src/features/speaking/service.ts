/**
 * Luyện giao tiếp: ngân hàng câu hỏi người học tự tạo (theo HSK / tag) và câu trả lời của họ trên vở ô ly.
 * Mọi hàm nhận userId của SESSION và lọc theo đó — câu hỏi, câu trả lời không bao giờ lộ sang người khác.
 * Pinyin tự sinh tại máy chủ (pinyin-pro); nghĩa tiếng Việt và nhận xét câu trả lời nhờ AI (Claude) khi có
 * ANTHROPIC_API_KEY, không có thì dùng nghĩa ghép theo từ điển và nhận xét theo quy tắc đơn giản.
 */
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { speakingQuestion, vocab } from "@/server/db/schema";
import { SPEAKING } from "@/lib/limits";
import { fold, foldCompact } from "@/lib/fold";
import { sentencePinyin } from "@/lib/sentence-pinyin";
import { dictEntries } from "@/lib/builtin-dict";
import { aiEnabled, reviewAnswer, takeAiBudget, translateToVietnamese, type AnswerFeedback } from "@/server/ai";
import type { QuestionInput, QuestionListParams } from "./schema";

export class SpeakingError extends Error {
  constructor(
    public code: "not-found" | "validation",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy câu hỏi này.";
const TOO_MANY = `Bạn đã có tối đa ${SPEAKING.MAX_QUESTIONS} câu hỏi.`;
const EMPTY_ANSWER = "Vui lòng viết hoặc nói câu trả lời trước.";

type Row = typeof speakingQuestion.$inferSelect;
const own = (userId: string, id: string) => and(eq(speakingQuestion.userId, userId), eq(speakingQuestion.id, id));
const hasHan = (s: string) => /\p{Script=Han}/u.test(s);

// ---------- Pinyin + nghĩa tự động ----------

/** Pinyin cả câu (chữ thường đầu câu như sách — giữ cách viết của sentencePinyin). */
async function autoPinyin(zh: string) {
  return hasHan(zh) ? (await sentencePinyin(zh)).slice(0, SPEAKING.MAX_PINYIN) : "";
}

let dictCache: Map<string, string> | null = null;
function dictMeanings() {
  if (dictCache) return dictCache;
  dictCache = new Map();
  for (const [zh, e] of dictEntries()) if (e.vi) dictCache.set(zh, e.vi.split(/[;,，；]/)[0]!.trim());
  return dictCache;
}
/**
 * Nghĩa ghép theo từ (dự phòng khi không có AI): tách câu theo từ dài nhất có trong từ điển có sẵn + Từ vựng của
 * chính người học, nối nghĩa từng từ. Không phải bản dịch — giao diện ghi rõ "gợi ý theo từ".
 */
async function glossMeaning(userId: string, zh: string) {
  const chars = [...zh].filter((c) => hasHan(c));
  if (!chars.length) return "";
  const text = chars.join("");
  const cands = new Set<string>();
  for (let i = 0; i < text.length; i++)
    for (let n = 1; n <= 4 && i + n <= text.length; n++) cands.add(text.slice(i, i + n));
  const mine = await db
    .select({ hanzi: vocab.hanzi, meaning: vocab.meaningVi })
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.hanzi, [...cands].slice(0, 400))));
  const m = new Map(dictMeanings());
  for (const r of mine) if (r.meaning) m.set(r.hanzi, r.meaning.split(/[;,，；]/)[0]!.trim());
  const out: string[] = [];
  for (let i = 0; i < text.length;) {
    let n = Math.min(4, text.length - i);
    while (n > 1 && !m.has(text.slice(i, i + n))) n--;
    const w = text.slice(i, i + n);
    const v = m.get(w);
    if (v) out.push(v);
    i += n;
  }
  return out.join(" · ").slice(0, SPEAKING.MAX_MEANING);
}

/** Nghĩa tiếng Việt cho nhiều câu: AI dịch cả lô (1 lần gọi); không được → ghép theo từ. */
async function autoMeanings(userId: string, sentences: string[]) {
  const ai = !sentences.length ? [] : takeAiBudget(userId) ? await translateToVietnamese(sentences) : null;
  if (ai) return { meanings: ai.map((s) => s.slice(0, SPEAKING.MAX_MEANING)), source: "ai" as const };
  return { meanings: await Promise.all(sentences.map((s) => glossMeaning(userId, s))), source: "gloss" as const };
}

/** Pinyin + nghĩa cho một câu (xem trước ở màn tạo câu hỏi). */
export async function assist(userId: string, text: string) {
  const [pinyin, m] = await Promise.all([autoPinyin(text), autoMeanings(userId, [text])]);
  return { pinyin, meaning: m.meanings[0] ?? "", source: m.source, ai: aiEnabled() };
}

// ---------- Câu hỏi ----------

function view(r: Row) {
  const { userId: _u, feedback, ...rest } = r;
  return { ...rest, feedback: (feedback as Feedback | null) ?? null };
}
export type SpeakingQuestion = ReturnType<typeof view>;

/** Danh sách (tìm theo chữ Hán / pinyin không dấu / nghĩa; lọc tag, HSK, đánh dấu) + tag và số câu mỗi HSK. */
export async function listQuestions(userId: string, p: QuestionListParams) {
  const rows = await db
    .select()
    .from(speakingQuestion)
    .where(eq(speakingQuestion.userId, userId))
    .orderBy(asc(speakingQuestion.createdAt));
  const tagCount = new Map<string, { name: string; count: number }>();
  for (const r of rows)
    for (const t of r.tags) {
      const k = t.toLowerCase();
      const x = tagCount.get(k) ?? { name: t, count: 0 };
      x.count++;
      tagCount.set(k, x);
    }
  const hskCounts = [1, 2, 3, 4, 5, 6].map((h) => ({ hsk: h, count: rows.filter((r) => r.hsk === h).length }));
  const f = fold(p.q);
  const fc = foldCompact(p.q);
  const filtered = rows.filter(
    (r) =>
      (!p.q ||
        r.zh.includes(p.q) ||
        (fc && foldCompact(r.pinyin).includes(fc)) ||
        fold(`${r.meaning} ${r.tags.join(" ")}`).includes(f)) &&
      (!p.tag || r.tags.some((t) => t.toLowerCase() === p.tag.toLowerCase())) &&
      (!p.hsk || r.hsk === p.hsk) &&
      (!p.starred || r.starred),
  );
  // Số thứ tự cố định theo thứ tự tạo (như màn Luyện: "Câu hỏi n / N").
  const order = new Map(rows.map((r, i) => [r.id, i + 1]));
  const sorted =
    p.sort === "oldest"
      ? filtered
      : p.sort === "az"
        ? [...filtered].sort((a, b) => foldCompact(a.pinyin).localeCompare(foldCompact(b.pinyin)))
        : [...filtered].reverse();
  const pages = Math.max(1, Math.ceil(sorted.length / p.size));
  const page = Math.min(p.page, pages);
  return {
    items: sorted.slice((page - 1) * p.size, page * p.size).map((r) => ({ ...view(r), no: order.get(r.id)! })),
    total: sorted.length,
    all: rows.length,
    page,
    pages,
    tags: [...tagCount.values()].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    hskCounts,
  };
}
export type QuestionList = Awaited<ReturnType<typeof listQuestions>>;

/** Một câu hỏi + vị trí trong bộ câu hỏi (theo thứ tự tạo) để chuyển câu trước / tiếp theo. */
export async function getQuestion(userId: string, id: string) {
  const [row] = await db.select().from(speakingQuestion).where(own(userId, id)).limit(1);
  if (!row) throw new SpeakingError("not-found", NOT_FOUND);
  const ids = (
    await db
      .select({ id: speakingQuestion.id })
      .from(speakingQuestion)
      .where(eq(speakingQuestion.userId, userId))
      .orderBy(asc(speakingQuestion.createdAt))
  ).map((r) => r.id);
  const i = ids.indexOf(row.id);
  return {
    ...view(row),
    nav: { index: i + 1, total: ids.length, prev: ids[i - 1] ?? null, next: ids[i + 1] ?? null },
    ai: aiEnabled(),
  };
}
export type QuestionDetail = Awaited<ReturnType<typeof getQuestion>>;

/** Tạo một hoặc nhiều câu hỏi; pinyin / nghĩa bỏ trống thì tự sinh. Trả về id theo thứ tự. */
export async function createQuestions(userId: string, inputs: QuestionInput[]) {
  const [c] = await db.select({ n: count() }).from(speakingQuestion).where(eq(speakingQuestion.userId, userId));
  if ((c?.n ?? 0) + inputs.length > SPEAKING.MAX_QUESTIONS) throw new SpeakingError("validation", TOO_MANY);
  const needMeaning = inputs.filter((q) => !q.meaning).map((q) => q.zh);
  const { meanings } = await autoMeanings(userId, needMeaning);
  let k = 0;
  const values = await Promise.all(
    inputs.map(async (q) => ({
      userId,
      zh: q.zh,
      pinyin: q.pinyin || (await autoPinyin(q.zh)),
      meaning: q.meaning || meanings[k++] || "",
      hsk: q.hsk,
      tags: q.tags,
    })),
  );
  // Giữ thứ tự tạo ổn định khi tạo nhiều câu cùng lúc.
  const base = Date.now();
  const rows = await db
    .insert(speakingQuestion)
    .values(values.map((v, i) => ({ ...v, createdAt: new Date(base + i), updatedAt: new Date(base + i) })))
    .returning({ id: speakingQuestion.id });
  return { ids: rows.map((r) => r.id) };
}

/** Sửa câu hỏi (pinyin / nghĩa bỏ trống → tự sinh lại). */
export async function updateQuestion(userId: string, id: string, q: QuestionInput) {
  const cur = await getRow(userId, id);
  const meaning = q.meaning || (await autoMeanings(userId, [q.zh])).meanings[0] || "";
  await db
    .update(speakingQuestion)
    .set({
      zh: q.zh,
      pinyin: q.pinyin || (q.zh === cur.zh ? cur.pinyin : "") || (await autoPinyin(q.zh)),
      meaning,
      hsk: q.hsk,
      tags: q.tags,
    })
    .where(own(userId, id));
  return getQuestion(userId, id);
}

async function getRow(userId: string, id: string) {
  const [row] = await db.select().from(speakingQuestion).where(own(userId, id)).limit(1);
  if (!row) throw new SpeakingError("not-found", NOT_FOUND);
  return row;
}

export async function deleteQuestion(userId: string, id: string) {
  const r = await db.delete(speakingQuestion).where(own(userId, id)).returning({ id: speakingQuestion.id });
  if (!r.length) throw new SpeakingError("not-found", NOT_FOUND);
  return { deleted: true };
}

export async function deleteQuestions(userId: string, ids: string[]) {
  if (!ids.length) return { deleted: 0 };
  const r = await db
    .delete(speakingQuestion)
    .where(and(eq(speakingQuestion.userId, userId), inArray(speakingQuestion.id, ids)))
    .returning({ id: speakingQuestion.id });
  return { deleted: r.length };
}

export async function setStarred(userId: string, id: string, starred: boolean) {
  await getRow(userId, id);
  await db.update(speakingQuestion).set({ starred }).where(own(userId, id));
  return { starred };
}

// ---------- Câu trả lời ----------

/**
 * Lưu câu trả lời và sinh lại pinyin + nghĩa (chỉ khi nội dung đổi). Xoá trắng = xoá câu trả lời và nhận xét.
 * `answerPinyin` / `answerMeaning` gửi kèm = người học tự sửa → lưu đúng như vậy (không sinh lại).
 * Chuyển câu trước / tiếp theo trên giao diện gọi hàm này trước nên không mất bài đang viết.
 */
export async function saveAnswer(
  userId: string,
  id: string,
  answer: string,
  edit: { answerPinyin?: string; answerMeaning?: string } = {},
) {
  const cur = await getRow(userId, id);
  const changed = answer !== cur.answer;
  const manual = edit.answerPinyin !== undefined || edit.answerMeaning !== undefined;
  if (!changed && !manual)
    return { answer, answerPinyin: cur.answerPinyin, answerMeaning: cur.answerMeaning, changed: false };
  let answerPinyin = cur.answerPinyin;
  let answerMeaning = cur.answerMeaning;
  if (changed) {
    const needPinyin = edit.answerPinyin === undefined;
    const needMeaning = edit.answerMeaning === undefined;
    const [p, m] =
      answer && (needPinyin || needMeaning)
        ? await Promise.all([
            needPinyin ? autoPinyin(answer) : "",
            needMeaning ? autoMeanings(userId, [answer]) : { meanings: [""] },
          ])
        : ["", { meanings: [""] }];
    if (needPinyin) answerPinyin = p;
    if (needMeaning) answerMeaning = m.meanings[0] ?? "";
  }
  if (edit.answerPinyin !== undefined) answerPinyin = edit.answerPinyin;
  if (edit.answerMeaning !== undefined) answerMeaning = edit.answerMeaning;
  if (!answer) [answerPinyin, answerMeaning] = ["", ""];
  await db
    .update(speakingQuestion)
    .set({ answer, answerPinyin, answerMeaning, ...(changed ? { feedback: null } : {}) })
    .where(own(userId, id));
  return { answer, answerPinyin, answerMeaning, changed };
}

export type Feedback = AnswerFeedback & { ai: boolean };

/** Nhận xét đơn giản khi không có AI: độ dài, có chữ Hán, dấu câu cuối, có dùng lại từ của câu hỏi. */
function ruleFeedback(question: string, answer: string): Feedback {
  const han = [...answer].filter(hasHan);
  const issues: Feedback["issues"] = [];
  if (han.length < 4)
    issues.push({
      kind: "relevance",
      text_vi: "Câu trả lời hơi ngắn — thử nói thành một câu đầy đủ (chủ ngữ + động từ + …).",
    });
  if (!/[。！？!?.]$/.test(answer))
    issues.push({ kind: "grammar", text_vi: "Nhớ kết thúc câu bằng dấu câu (。！？)." });
  if (/[吗呢]/.test(answer.slice(-2)))
    issues.push({
      kind: "naturalness",
      text_vi: "Câu trả lời thường không kết thúc bằng 吗 / 呢 — đây là trợ từ nghi vấn.",
    });
  const keys = [...new Set([...question].filter(hasHan))].filter(
    (c) => !"你我他她们的是吗呢什么么怎样哪儿里谁几多".includes(c),
  );
  const reused = keys.filter((c) => answer.includes(c)).length;
  if (keys.length && !reused)
    issues.push({ kind: "relevance", text_vi: "Có thể dùng lại từ khoá của câu hỏi để trả lời đúng trọng tâm hơn." });
  return {
    ai: false,
    verdict: issues.length === 0 ? "good" : issues.length <= 1 ? "good" : "needs_work",
    summary_vi: issues.length
      ? "Đã kiểm tra cơ bản (chưa bật trợ lý AI nên chưa nhận xét được ngữ pháp chi tiết)."
      : "Câu trả lời đầy đủ. (Chưa bật trợ lý AI nên chỉ kiểm tra cơ bản.)",
    corrected_zh: answer,
    issues,
    better_zh: "",
  };
}

/** Kiểm tra câu trả lời: lưu câu trả lời, nhận xét (AI hoặc quy tắc), lưu nhận xét. Không chấm theo đáp án cố định. */
export async function checkAnswer(userId: string, id: string, answer: string) {
  if (!answer || !hasHan(answer)) throw new SpeakingError("validation", EMPTY_ANSWER);
  const saved = await saveAnswer(userId, id, answer);
  const q = await getRow(userId, id);
  const ai = takeAiBudget(userId) ? await reviewAnswer(q.zh, answer, q.hsk) : null;
  const feedback: Feedback = ai ? { ...ai, ai: true } : ruleFeedback(q.zh, answer);
  await db.update(speakingQuestion).set({ feedback }).where(own(userId, id));
  return { ...saved, feedback };
}

/** Xuất dữ liệu (sao lưu tài khoản). */
export async function exportQuestions(userId: string) {
  const rows = await db
    .select()
    .from(speakingQuestion)
    .where(eq(speakingQuestion.userId, userId))
    .orderBy(desc(speakingQuestion.createdAt));
  return rows.map(view);
}
