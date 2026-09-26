import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { pool } from "@/server/db/pool";
import { isPinyinSyllable, normalizePinyin, samePinyin, splitSyllables, splitTone } from "@/lib/pinyin";
import {
  FINAL_GROUPS,
  FINALS,
  INITIALS,
  SANDHI_RULES,
  TONES,
  isTopic,
  topicHref,
  topicLabel,
} from "@/data/pronunciation";
import {
  checkAnswer,
  distractors,
  generatePractice,
  parseSyllable,
  PRACTICE_MODES,
} from "@/features/pronunciation/practice";
import { noteInputSchema, noteUpdateSchema, practiceQuerySchema } from "@/features/pronunciation/schema";
import * as svc from "@/features/pronunciation/service";
import { cleanupUsers, makeUser } from "./helpers";

/** Bộ sinh số ngẫu nhiên cố định (để test lặp lại được). */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("pinyin: tách thanh, chuẩn hoá, so sánh", () => {
  it("splitTone / splitSyllables / isPinyinSyllable", () => {
    expect(splitTone("hǎo")).toEqual({ plain: "hao", tone: 3 });
    expect(splitTone("lǜ")).toEqual({ plain: "lü", tone: 4 });
    expect(splitTone("ma")).toEqual({ plain: "ma", tone: 5 });
    expect(splitSyllables("shuíguǒ")).toEqual(["shuí", "guǒ"]);
    expect(splitSyllables("nǐ hǎo")).toEqual(["nǐ", "hǎo"]);
    expect(splitSyllables("zhǎnlǎnguǎn")).toEqual(["zhǎn", "lǎn", "guǎn"]);
    expect(isPinyinSyllable("zhuang")).toBe(true);
    expect(isPinyinSyllable("lv")).toBe(true);
    expect(isPinyinSyllable("bong")).toBe(false);
  });
  it("gõ số thanh, v, hoa thường, khoảng trắng đều được chấp nhận", () => {
    expect(samePinyin("ba1", "bā")).toBe(true);
    expect(samePinyin("Ni3 hao3", "nǐhǎo")).toBe(true);
    expect(samePinyin("lv4", "lǜ")).toBe(true);
    expect(samePinyin("xie4xie", "xiè xie")).toBe(true);
    expect(samePinyin("ba2", "bā")).toBe(false);
    expect(samePinyin("", "")).toBe(false);
    expect(normalizePinyin(" Zhōng-guó ")).toBe("zhōngguó");
  });
});

describe("nội dung", () => {
  it("21 thanh mẫu, 36 vận mẫu (6 đơn, 13 kép, 16 mũi, er), 5 thanh, 4 quy tắc biến điệu", () => {
    expect(INITIALS).toHaveLength(21);
    expect(new Set(INITIALS.map((i) => i.symbol)).size).toBe(21);
    expect(FINALS).toHaveLength(36);
    const by = Object.fromEntries(FINAL_GROUPS.map((g) => [g.id, FINALS.filter((f) => f.group === g.id).length]));
    expect(by).toEqual({ single: 6, compound: 13, nasal: 16, special: 1 });
    expect(TONES.map((t) => t.tone)).toEqual([1, 2, 3, 4, 5]);
    expect(SANDHI_RULES.map((r) => r.id)).toEqual(["third-two", "third-three", "yi", "bu"]);
    for (const x of [...INITIALS, ...FINALS]) {
      expect(x.examples.length).toBeGreaterThan(0);
      expect(x.how.vi.length).toBe(x.how.en.length);
      expect(x.speak).toMatch(/^\p{Script=Han}$/u);
    }
  });
  it("mỗi ví dụ biến điệu có số âm tiết khớp giữa cách viết và cách đọc; có âm tiết thực sự đổi thanh", () => {
    for (const r of SANDHI_RULES)
      for (const e of r.examples) {
        const a = splitSyllables(e.pinyin);
        const b = splitSyllables(e.spoken);
        expect(a.length, e.hanzi).toBe([...e.hanzi].length);
        expect(b.length, e.hanzi).toBe(a.length);
        expect(a.map((s) => splitTone(s).plain)).toEqual(b.map((s) => splitTone(s).plain));
        expect(e.spoken).not.toBe(e.pinyin);
      }
  });
  it("mỗi ví dụ chứa đúng thanh mẫu / vận mẫu được dạy (tính cả cách viết y, w, iu, ui, un, ü)", () => {
    const INI = ["zh", "ch", "sh", ..."bpmfdtnlgkhjqxrzcs"];
    const WHOLE: Record<string, string> = {
      yi: "i",
      wu: "u",
      yu: "ü",
      ya: "ia",
      ye: "ie",
      yao: "iao",
      you: "iou",
      yan: "ian",
      yin: "in",
      yang: "iang",
      ying: "ing",
      yong: "iong",
      yue: "üe",
      yuan: "üan",
      yun: "ün",
      wa: "ua",
      wo: "uo",
      wai: "uai",
      wei: "uei",
      wan: "uan",
      wen: "uen",
      wang: "uang",
      weng: "ueng",
    };
    const parts = (syl: string) => {
      const plain = splitTone(syl).plain;
      if (WHOLE[plain]) return { i: "", f: WHOLE[plain]! };
      const i = INI.find((x) => plain.startsWith(x) && plain.length > x.length) ?? "";
      let f = plain.slice(i.length);
      if ("jqx".includes(i) && i && f.startsWith("u")) f = "ü" + f.slice(1);
      f = ({ iu: "iou", ui: "uei", un: "uen" } as Record<string, string>)[f] ?? f;
      return { i, f };
    };
    for (const x of INITIALS)
      for (const e of x.examples)
        expect(
          splitSyllables(e.pinyin).map((s) => parts(s).i),
          `${x.symbol}: ${e.hanzi}`,
        ).toContain(x.symbol);
    for (const x of FINALS)
      for (const e of x.examples)
        expect(
          splitSyllables(e.pinyin).map((s) => parts(s).f),
          `${x.symbol}: ${e.hanzi}`,
        ).toContain(x.symbol);
  });

  it("chữ máy đọc khớp pinyin hiển thị, và âm tiết đó chứa đúng thanh mẫu / vận mẫu đang dạy", () => {
    for (const x of [...INITIALS, ...FINALS]) {
      // Cách đọc mặc định (phổ biến nhất) của chữ = cách giọng đọc của máy sẽ đọc.
      expect(pinyin(x.speak), `${x.symbol}: ${x.speak}`).toBe(x.speakPinyin);
    }
    for (const x of INITIALS) expect(splitTone(x.speakPinyin).plain.startsWith(x.symbol), x.symbol).toBe(true);
    // Vận mẫu: đọc âm tiết không phụ âm (y / w) khi có; ei, eng, ong không có chữ đứng riêng thông dụng nên kèm phụ âm.
    const WITH_INITIAL = ["ei", "eng", "ong"];
    for (const x of FINALS)
      if (!WITH_INITIAL.includes(x.symbol))
        expect(/^[ywaoe]/.test(splitTone(x.speakPinyin).plain), `${x.symbol}: ${x.speakPinyin}`).toBe(true);
      else expect(splitTone(x.speakPinyin).plain.endsWith(x.symbol), x.symbol).toBe(true);
  });

  it("mã mục ghi chú: hợp lệ / không hợp lệ", () => {
    for (const t of ["initial:zh", "final:ü", "tone:3", "tone:5", "sandhi:yi", "sandhi:third-two:0", "sandhi:general"])
      expect(isTopic(t), t).toBe(true);
    for (const t of [
      "initial:w",
      "final:",
      "tone:6",
      "sandhi:x",
      "sandhi:bu:9",
      "sandhi:bu:a",
      "free:1",
      "initial:b:c",
      "",
    ])
      expect(isTopic(t), t).toBe(false);
    expect(topicLabel("sandhi:third-two:0")).toEqual({
      vi: "Hai thanh 3 liên tiếp · 你好",
      en: "Two third tones · 你好",
    });
    expect(topicHref("initial:zh")).toBe("/pronunciation/initials?s=zh");
    expect(topicHref("sandhi:bu:1")).toBe("/pronunciation/sandhi?rule=bu");
  });
});

describe("tạo bài luyện tập", () => {
  it("phương án nhiễu: đổi phụ âm đầu cùng thanh + đổi thanh; không trùng đáp án", () => {
    expect(parseSyllable("zhōng")).toEqual({ plain: "zhong", initial: "zh", rest: "ong", tone: 1 });
    const d = distractors("bā", 3, seeded());
    expect(d).toHaveLength(3);
    expect(d).not.toContain("bā");
    expect(new Set(d).size).toBe(3);
    // j q x + u (= ü) chỉ đổi trong nhóm j q x.
    for (const x of distractors("qù", 3, seeded(7))) expect(x).toMatch(/^(j|x|q)/);
  });
  it("mọi chế độ: đúng số câu, lựa chọn chứa đáp án và không trùng", () => {
    for (const mode of PRACTICE_MODES) {
      const qs = generatePractice(mode, 10, seeded(3));
      expect(qs, mode).toHaveLength(10);
      for (const q of qs) {
        expect(q.mode).toBe(mode);
        expect(q.speak).toMatch(/\p{Script=Han}/u);
        if (mode === "listen-type" || mode === "speak-compare") expect(q.options).toEqual([]);
        else {
          expect(q.options, `${mode} ${q.hanzi}`).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBe(mode === "pairs" ? 2 : 4);
        }
      }
    }
    const s = generatePractice("sandhi", 5, seeded(9));
    for (const q of s) {
      expect(q.written).toBeTruthy();
      expect(q.options).toContain(q.written); // cách viết từ điển là một phương án nhiễu
      expect(q.hint.rule).toBeTruthy();
    }
  });
  it("giới hạn số câu 1–20; chấm đáp án", () => {
    expect(generatePractice("pairs", 0)).toHaveLength(1);
    expect(generatePractice("listen-choose", 99)).toHaveLength(20);
    expect(practiceQuerySchema.parse({ mode: "pairs", count: "abc" }).count).toBe(10);
    expect(() => practiceQuerySchema.parse({ mode: "hack" })).toThrow("Chế độ luyện tập không hợp lệ.");
    expect(checkAnswer({ answer: "bā", options: ["bā", "pā"] }, "bā")).toBe(true);
    expect(checkAnswer({ answer: "bā", options: ["bā", "pā"] }, "ba1")).toBe(false);
    expect(checkAnswer({ answer: "nǐ hǎo", options: [] }, "ni3hao3")).toBe(true);
  });
});

describe("ghi chú phát âm (riêng từng người)", () => {
  let A: string;
  let B: string;
  beforeAll(async () => {
    await cleanupUsers();
    [A, B] = [await makeUser("pa"), await makeUser("pb")];
  });
  afterAll(async () => {
    await cleanupUsers();
    await pool.end();
  });

  it("ghi chú của mục: tạo, ghi đè, nội dung rỗng = xoá; tiêu đề mặc định là tên mục", async () => {
    const n = await svc.saveNote(A, noteInputSchema.parse({ topic: "initial:zh", content: " cong lưỡi " }));
    expect(n).toMatchObject({ topic: "initial:zh", title: "Thanh mẫu zh", content: "cong lưỡi" });
    const again = await svc.saveNote(A, noteInputSchema.parse({ topic: "initial:zh", content: "zh ≠ z" }));
    expect(again!.id).toBe(n!.id);
    expect(await svc.topicNotes(A)).toEqual({ "initial:zh": "zh ≠ z" });
    expect(await svc.saveNote(A, noteInputSchema.parse({ topic: "initial:zh", content: "" }))).toBeNull();
    expect(await svc.topicNotes(A)).toEqual({});
  });

  it("ghi chú tự do: bắt buộc tiêu đề + nội dung; sửa, xoá", async () => {
    expect(() => noteInputSchema.parse({ content: "" })).toThrow("Vui lòng nhập tiêu đề ghi chú.");
    expect(() => noteInputSchema.parse({ topic: "tone:9", content: "x" })).toThrow("Mục ghi chú không hợp lệ.");
    expect(() => noteUpdateSchema.parse({ content: "" })).toThrow("Vui lòng nhập nội dung ghi chú.");
    const n = (await svc.saveNote(A, noteInputSchema.parse({ title: "Ví dụ 你好", content: "ní hǎo" })))!;
    expect(n.topic).toBeNull();
    const u = await svc.updateNote(A, n.id, noteUpdateSchema.parse({ title: "Sửa", content: "mới" }));
    expect(u).toMatchObject({ title: "Sửa", content: "mới" });
    await expect(svc.updateNote(A, n.id, { title: "", content: "x" })).rejects.toThrow(
      "Vui lòng nhập tiêu đề ghi chú.",
    );
    expect((await svc.listNotes(A)).map((x) => x.id)).toEqual([n.id]);
    await svc.deleteNote(A, n.id);
    expect(await svc.listNotes(A)).toEqual([]);
  });

  it("người khác không xem / sửa / xoá được ghi chú của tôi (→ không tìm thấy)", async () => {
    const n = (await svc.saveNote(A, noteInputSchema.parse({ title: "Bí mật", content: "của A" })))!;
    await svc.saveNote(A, noteInputSchema.parse({ topic: "sandhi:general", content: "riêng A" }));
    await expect(svc.getNote(B, n.id)).rejects.toMatchObject({ code: "not-found" });
    await expect(svc.updateNote(B, n.id, { content: "B sửa" })).rejects.toMatchObject({ code: "not-found" });
    await expect(svc.deleteNote(B, n.id)).rejects.toMatchObject({ code: "not-found" });
    expect(await svc.listNotes(B)).toEqual([]);
    expect(await svc.topicNotes(B)).toEqual({});
    // B lưu cùng mục → ghi chú riêng của B, không ghi đè của A.
    await svc.saveNote(B, noteInputSchema.parse({ topic: "sandhi:general", content: "của B" }));
    expect((await svc.topicNotes(A))["sandhi:general"]).toBe("riêng A");
    expect((await svc.getNote(A, n.id)).content).toBe("của A");
  });
});
