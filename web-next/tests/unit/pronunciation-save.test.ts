import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { INITIALS } from "@/data/pronunciation";
import { savedSoundExamples, saveSoundExamples } from "@/features/pronunciation/save";
import { PronunciationError } from "@/features/pronunciation/service";
import { listVocab, updateVocab } from "@/features/vocabulary/service";
import { listParamsSchema, vocabInputSchema } from "@/features/vocabulary/schema";
import { cleanupUsers, makeUser } from "./helpers";

let A: string;
let B: string;
beforeAll(async () => {
  await cleanupUsers();
  [A, B] = [await makeUser("psa"), await makeUser("psb")];
});
afterAll(async () => {
  await cleanupUsers();
  await pool.end();
});

describe("Thư viện › Phát âm: lưu từ ví dụ vào Từ vựng của tôi", () => {
  const b = INITIALS.find((x) => x.symbol === "b")!;

  it("lưu một từ / cả âm, tag Phát âm + tên âm, bấm lại không trùng, chỉ vào kho người bấm", async () => {
    const first = b.examples[0]!;
    expect(await saveSoundExamples(A, "initial", "b", first.hanzi, "vi")).toEqual({ added: 1, skipped: 0 });
    expect(await saveSoundExamples(A, "initial", "b", null, "vi")).toEqual({
      added: b.examples.length - 1,
      skipped: 1,
    });
    const mine = await listVocab(A, listParamsSchema.parse({ tag: "Thanh mẫu b" }));
    expect(mine.total).toBe(b.examples.length);
    expect(mine.items[0]!.tags).toEqual(expect.arrayContaining(["Phát âm", "Thanh mẫu b"]));
    expect(await savedSoundExamples(A, "initial")).toEqual(expect.arrayContaining(b.examples.map((e) => e.hanzi)));
    expect(await savedSoundExamples(B, "initial")).toEqual([]);
    expect((await listVocab(B, listParamsSchema.parse({}))).total).toBe(0);
  });

  it("bản sao sửa / thêm tag được mà nội dung Thư viện không đổi", async () => {
    const w = (await listVocab(A, listParamsSchema.parse({ tag: "Thanh mẫu b" }))).items[0]!;
    await updateVocab(
      A,
      w.id,
      vocabInputSchema.parse({
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        meaningVi: "nghĩa tôi tự ghi",
        tags: [...w.tags, "Khó nhớ"],
      }),
    );
    const after = (await listVocab(A, listParamsSchema.parse({ tag: "Khó nhớ" }))).items[0]!;
    expect(after.meaningVi).toBe("nghĩa tôi tự ghi");
    expect(b.examples.find((e) => e.hanzi === w.hanzi)!.meaning.vi).not.toBe("nghĩa tôi tự ghi");
  });

  it("âm hoặc từ không có trong Thư viện → not-found", async () => {
    await expect(saveSoundExamples(A, "initial", "xx", null, "vi")).rejects.toBeInstanceOf(PronunciationError);
    await expect(saveSoundExamples(A, "final", "ang", "咖啡", "vi")).rejects.toBeInstanceOf(PronunciationError);
  });
});
