import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { T_ITEMS } from "@/data/translation/items";
import { T_GRAMMAR, T_GRAMMAR_BY_ID } from "@/data/translation/grammar";
import * as tr from "@/features/translation/service";
import { translationConfigSchema } from "@/features/translation/schema";
import { history } from "@/features/progress/service";
import { listSentences } from "@/features/sentences/service";
import { createVocab } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { createGrammar } from "@/features/grammar/service";
import { grammarInputSchema } from "@/features/grammar/schema";
import { cleanupUsers, makeUser } from "./helpers";

let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("tra"), await makeUser("trb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

const cfg = (x: Record<string, unknown> = {}) => ({ ...translationConfigSchema.parse(x), lang: "vi" as const });

describe("kho câu mẫu", () => {
  it("dữ liệu hợp lệ: id duy nhất, ngữ pháp tồn tại, từ có trong câu, pinyin khớp số chữ", () => {
    expect(new Set(T_ITEMS.map((i) => i.id)).size).toBe(T_ITEMS.length);
    expect(new Set(T_GRAMMAR.map((g) => g.id)).size).toBe(T_GRAMMAR.length);
    for (const i of T_ITEMS) {
      expect(i.vi.length, i.id).toBeGreaterThan(0);
      expect(i.en.length, i.id).toBeGreaterThan(0);
      expect(i.grammar.length, i.id).toBeGreaterThan(0);
      for (const g of i.grammar) expect(T_GRAMMAR_BY_ID.has(g.id), `${i.id} ${g.id}`).toBe(true);
      for (const w of i.words)
        for (const part of w.zh.split("…").filter(Boolean)) expect(i.zh.includes(part), `${i.id} ${w.zh}`).toBe(true);
      // Số âm tiết = số chữ Hán (儿 hoá vào âm trước, vd 哪儿 → nǎr).
      const han = [...i.zh.replace(/[^\p{Script=Han}]/gu, "")];
      const erhua = (i.py.match(/\p{L}r\b/gu) ?? []).filter((s) => !/[eēéěè]r$/.test(s)).length;
      const syl = i.py
        .replace(/[^\p{L}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean).length;
      expect(syl, `${i.id} ${i.py}`).toBe(han.length - erhua);
      expect(/\p{Script=Han}/u.test(i.py)).toBe(false);
    }
    for (const lv of [1, 2, 3, 4])
      expect(T_ITEMS.filter((i) => i.level === lv && i.type === "sentence").length).toBeGreaterThan(4);
    expect(T_ITEMS.filter((i) => i.type === "paragraph").length).toBeGreaterThanOrEqual(8);
  });

  it("lọc kho câu theo cấp / ngữ pháp / từ khoá, có giải thích theo ngôn ngữ", () => {
    const bi = tr.listBank({ grammar: "bi" }, "vi");
    expect(bi.length).toBeGreaterThan(1);
    expect(bi.every((i) => i.grammar.some((g) => g.id === "bi"))).toBe(true);
    expect(bi[0]!.grammar.find((g) => g.id === "bi")!.explain).toMatch(/hơn/);
    expect(tr.listBank({ grammar: "bi" }, "en")[0]!.grammar.find((g) => g.id === "bi")!.explain).toMatch(/than/);
    expect(tr.listBank({ q: "cà phê" }, "vi").map((i) => i.id)).toContain("s013");
    expect(tr.listBank({ level: 1, type: "paragraph" }, "vi").every((i) => i.level === 1)).toBe(true);
    expect(() => tr.getBankItem("nope", "vi")).toThrow(tr.TranslationError);
  });
});

describe("chấm", () => {
  const s019 = T_ITEMS.find((i) => i.id === "s019")!;
  it("Việt → Trung: bỏ dấu câu / khoảng trắng; cách nói khác cũng đúng", () => {
    expect(tr.gradeTranslation(s019, "to-zh", "vi", "我哥哥比我高").ok).toBe(true);
    expect(tr.gradeTranslation(s019, "to-zh", "vi", " 我 哥哥 比 我 高 ！").ok).toBe(true);
    const s002 = T_ITEMS.find((i) => i.id === "s002")!;
    expect(tr.gradeTranslation(s002, "to-zh", "vi", "我的妈妈是医生。").ok).toBe(true);
    const wrong = tr.gradeTranslation(s019, "to-zh", "vi", "我哥哥比我很高");
    expect(wrong.ok).toBe(false);
    expect(wrong.similarity).toBeGreaterThan(80);
    expect(tr.gradeTranslation(s019, "to-zh", "vi", "").similarity).toBe(0);
  });
  it("Trung → Việt / Anh: không phân biệt dấu, hoa thường; nhiều bản dịch được chấp nhận", () => {
    expect(tr.gradeTranslation(s019, "from-zh", "vi", "anh trai toi cao hon toi").ok).toBe(true);
    expect(tr.gradeTranslation(s019, "from-zh", "en", "My brother is taller than me").ok).toBe(true);
    expect(tr.gradeTranslation(s019, "from-zh", "vi", "Tôi cao hơn anh trai").ok).toBe(false);
  });
});

describe("bài luyện dịch", () => {
  it("tạo theo ngữ pháp, không lộ đáp án trước khi trả lời, gợi ý 2 bước, chấm, bỏ qua, tính là đúng, nộp bài", async () => {
    const id = await tr.createTranslationSession(A, cfg({ source: "grammar", grammarIds: ["bi", "guo"], count: 3 }));
    let s = await tr.getTranslationSession(A, id);
    expect(s.total).toBe(3);
    const items = T_ITEMS.filter((i) => i.grammar.some((g) => g.id === "bi" || g.id === "guo"));
    // Chưa trả lời: không có lời giải, không có id câu mẫu, không có chữ Hán của đáp án (Việt → Trung).
    const q0 = s.questions[0]!;
    expect(q0.direction).toBe("to-zh");
    expect(q0.reveal).toBeUndefined();
    expect(q0.hintWords).toBeUndefined();
    const json = JSON.stringify(s.questions);
    expect(items.some((i) => json.includes(i.zh))).toBe(false);
    expect(items.some((i) => json.includes(`"${i.id}"`))).toBe(false);

    s = await tr.hintTranslation(A, id, 0);
    expect(s.questions[0]!.hintWords?.length).toBeGreaterThan(0);
    expect(s.questions[0]!.hintGrammar).toBeUndefined();
    s = await tr.hintTranslation(A, id, 0);
    expect(s.questions[0]!.hintGrammar?.length).toBeGreaterThan(0);

    s = await tr.answerTranslation(A, id, 0, "sai hoàn toàn", 30);
    expect(s.questions[0]!.result).toBe("wrong");
    expect(s.questions[0]!.reveal?.grammar.some((g) => g.id === "bi" || g.id === "guo")).toBe(true);
    expect(s.elapsedSec).toBe(30);
    s = await tr.overrideTranslation(A, id, 0);
    expect(s.questions[0]).toMatchObject({ result: "correct", overridden: true });
    await expect(tr.overrideTranslation(A, id, 0)).rejects.toThrow(tr.TranslationError);

    // Trả lời đúng câu 2 bằng chính đáp án (lấy từ kho).
    const zh = items.find((i) => i.vi[0] === s.questions[1]!.prompt.text)!.zh;
    s = await tr.answerTranslation(A, id, 1, zh, 20); // thời gian không giảm
    expect(s.questions[1]!.result).toBe("correct");
    expect(s.elapsedSec).toBe(30);
    await expect(tr.answerTranslation(A, id, 2 + 5, "x")).rejects.toThrow(tr.TranslationError);
    await expect(tr.completeTranslation(A, id)).rejects.toThrow("Bạn chưa làm hết các câu.");
    await tr.skipTranslation(A, id, 2, 95);

    // Người khác: không xem / không sửa được.
    await expect(tr.getTranslationSession(B, id)).rejects.toThrow(tr.TranslationError);
    await expect(tr.answerTranslation(B, id, 2, "x")).rejects.toThrow(tr.TranslationError);

    const done = await tr.completeTranslation(A, id, 120);
    expect(done).toMatchObject({ status: "completed", correctCount: 2, skippedCount: 1, elapsedSec: 120 });
    expect(await tr.getActiveTranslation(A)).toBeNull();
    const h = await tr.translationHistory(A);
    expect(h[0]).toMatchObject({ id, correct: 2, total: 3, elapsedSec: 120 });
    expect(await tr.translationHistory(B)).toEqual([]);
    const act = (await history(A, { kind: "translation", days: 1 }))[0]!;
    expect(act).toMatchObject({ correct: 2, total: 3, durationSec: 120 });
  });

  it("trộn chiều dịch, đoạn ngắn, hiện pinyin; tự chọn ưu tiên câu chưa làm", async () => {
    const id = await tr.createTranslationSession(
      A,
      cfg({ type: "paragraph", direction: "mixed", count: 2, showPinyin: true }),
    );
    const s = await tr.getTranslationSession(A, id);
    expect(s.questions.map((q) => q.direction)).toEqual(["to-zh", "from-zh"]);
    expect(s.questions.every((q) => q.type === "paragraph")).toBe(true);
    expect(s.questions[1]!.prompt.py).toBeTruthy();
    // Người mới (chưa có từ vựng) → HSK 1, tự chọn không quá HSK 2.
    expect(await tr.estimateLevel(B)).toBe(1);
    const p = await tr.pickItems(B, cfg({ count: 20 }));
    expect(p.items.every((i) => i.level <= 2)).toBe(true);
    expect(p.items.filter((i) => i.level === 1).length).toBeGreaterThanOrEqual(10);
  });

  it("theo từ vựng của tôi: chỉ câu có từ trong kho; kho trống → lỗi empty", async () => {
    const U = await makeUser("trv");
    await expect(tr.createTranslationSession(U, cfg({ source: "vocab" }))).rejects.toMatchObject({ code: "empty" });
    await createVocab(U, vocabInputSchema.parse({ hanzi: "咖啡", pinyin: "kāfēi", meaningVi: "cà phê" }));
    const p = await tr.pickItems(U, cfg({ source: "vocab", count: 20 }));
    expect(p.items.length).toBeGreaterThan(0);
    expect(p.items.every((i) => i.zh.includes("咖啡"))).toBe(true);
  });

  it("lưu câu mẫu vào Kho câu của tôi (trùng → duplicate); người khác không thấy", async () => {
    const r = await tr.saveItemToBank(A, "s019", "vi");
    expect(r.id).toBeTruthy();
    await expect(tr.saveItemToBank(A, "s019", "vi")).rejects.toMatchObject({ code: "duplicate" });
    const mine = await listSentences(A, { q: "", tag: "", page: 1 });
    expect(mine.items.map((i) => i.chinese)).toContain("我哥哥比我高。");
    expect((await listSentences(B, { q: "", tag: "", page: 1 })).items).toEqual([]);
    await expect(tr.saveItemToBank(A, "zzz", "vi")).rejects.toMatchObject({ code: "not-found" });
  });

  it("kiểm tra cấu hình", () => {
    expect(() => translationConfigSchema.parse({ source: "grammar" })).toThrow("Hãy chọn ít nhất một điểm ngữ pháp.");
    expect(() => translationConfigSchema.parse({ source: "grammar", grammarIds: ["x"] })).toThrow(
      "Điểm ngữ pháp không tồn tại.",
    );
    expect(() => translationConfigSchema.parse({ count: 50 })).toThrow();
  });
});

describe("làm lại ra câu khác, ngữ pháp của tôi, dịch đoạn 3–5 đoạn", () => {
  it("mỗi cấp HSK có ít nhất 5 đoạn để chọn 3–5 đoạn", () => {
    for (const lv of [1, 2, 3, 4])
      expect(T_ITEMS.filter((i) => i.type === "paragraph" && i.level === lv).length).toBeGreaterThanOrEqual(5);
    expect(() => translationConfigSchema.parse({ type: "paragraph", count: 4 })).not.toThrow();
  });

  it("làm lại (bài mới cùng lựa chọn) không lặp câu của bài trước khi còn câu chưa làm", async () => {
    const U = await makeUser("trr");
    const c = cfg({ type: "paragraph", level: 2, count: 3 });
    const s1 = await tr.getTranslationSession(U, await tr.createTranslationSession(U, c));
    const s2 = await tr.getTranslationSession(U, await tr.createTranslationSession(U, c));
    const zh = (s: typeof s1) => s.questions.map((q) => q.prompt.text);
    expect(zh(s2).some((t) => zh(s1).includes(t))).toBe(false);
  });

  it("ngữ pháp của tôi: câu hỏi lấy từ câu ví dụ đã nhập, giải thích dùng cấu trúc của tôi; người khác không dùng được", async () => {
    const U = await makeUser("trg");
    const gid = await createGrammar(
      U,
      grammarInputSchema.parse({
        title: "Câu so sánh 比 của tôi",
        meaning: "A hơn B",
        structure: "A + 比 + B + tính từ",
        examples: [
          { chinese: "猫比狗小。", pinyin: "Māo bǐ gǒu xiǎo.", vietnamese: "Mèo nhỏ hơn chó." },
          { chinese: "今天比昨天冷。", pinyin: "", vietnamese: "Hôm nay lạnh hơn hôm qua." },
        ],
      }),
    );
    const empty = await createGrammar(
      U,
      grammarInputSchema.parse({ title: "Chữ 把 của tôi", structure: "S + 把 + O + V" }),
    );
    const mine = await tr.myGrammarForTranslation(U);
    expect(mine.find((g) => g.id === gid)).toMatchObject({ examples: 2 });
    expect(mine.find((g) => g.id === empty)).toMatchObject({ examples: 0 });
    expect(await tr.myGrammarForTranslation(B)).toEqual([]);

    const id = await tr.createTranslationSession(U, cfg({ source: "grammar", myGrammarIds: [gid], count: 5 }));
    let s = await tr.getTranslationSession(U, id);
    expect(s.total).toBe(2);
    expect(s.questions.map((q) => q.prompt.text).sort()).toEqual(["Hôm nay lạnh hơn hôm qua.", "Mèo nhỏ hơn chó."]);
    const ans: Record<string, string> = { "Mèo nhỏ hơn chó.": "猫比狗小", "Hôm nay lạnh hơn hôm qua.": "今天比昨天冷" };
    const i = 0;
    s = await tr.answerTranslation(U, id, i, ans[s.questions[0]!.prompt.text]!);
    expect(s.questions[i]!.result).toBe("correct");
    expect(s.questions[i]!.reveal?.grammar[0]).toMatchObject({
      name: "Câu so sánh 比 của tôi",
      structure: "A + 比 + B + tính từ",
    });
    // Lưu câu ví dụ của mình vào kho câu.
    expect((await tr.saveItemToBank(U, s.questions[i]!.reveal!.id, "vi")).id).toBeTruthy();
    await expect(tr.saveItemToBank(B, s.questions[i]!.reveal!.id, "vi")).rejects.toMatchObject({ code: "not-found" });

    // Ngữ pháp chưa có ví dụ → câu mẫu hệ thống có chữ 把.
    const p = await tr.pickItems(U, cfg({ source: "grammar", myGrammarIds: [empty], count: 20 }));
    expect(p.items.length).toBeGreaterThan(0);
    expect(p.items.every((x) => x.zh.includes("把"))).toBe(true);
    // Ngữ pháp của người khác → không có câu nào.
    await expect(tr.createTranslationSession(B, cfg({ source: "grammar", myGrammarIds: [gid] }))).rejects.toMatchObject(
      {
        code: "empty",
      },
    );
  });
});
