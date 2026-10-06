import { describe, expect, it } from "vitest";
import { R_PASSAGES } from "@/data/reading/passages";
import { R_SCENES } from "@/data/reading/scenes";

describe("tranh minh hoạ bài đọc", () => {
  it("mỗi bài có tranh; số tranh nhỏ khớp số câu", () => {
    for (const p of R_PASSAGES) {
      const s = R_SCENES[p.id];
      expect(s, p.id).toBeDefined();
      expect(s!.lines, p.id).toHaveLength(p.lines.length);
      for (const e of [s!.main, ...s!.extras, ...s!.lines]) expect(e.trim(), p.id).not.toBe("");
    }
    expect(Object.keys(R_SCENES).sort()).toEqual(R_PASSAGES.map((p) => p.id).sort());
  });
});
