import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { libraryImage, libraryWord } from "@/server/db/schema";
import { findCandidates } from "@/features/library/analyze";
import { downloadSuggestedImage, isUploadUrl, suggestImages } from "@/features/library/image-suggest";
import * as lib from "@/features/library/service";
import { libWordInputSchema } from "@/features/library/schema";
import { cleanupUsers, makeUser } from "./helpers";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5f0000000049454e44ae426082",
  "hex",
);
const json = (d: unknown) => new Response(JSON.stringify(d), { headers: { "content-type": "application/json" } });
const meta = (artist: string) => ({
  Artist: { value: `<a href="x">${artist}</a>` },
  LicenseShortName: { value: "CC BY-SA 4.0" },
});

/** Giả lập Wikidata + Commons: trả lời theo tham số của từng request (không gọi mạng). */
function fakeWikimedia(opts: { evilThumb?: boolean } = {}) {
  const calls: string[] = [];
  const f = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    const p = url.searchParams;
    if (url.hostname === "www.wikidata.org" && p.get("action") === "wbsearchentities")
      return json({ search: [{ id: "Q89" }, { id: "bad id" }] });
    if (url.hostname === "www.wikidata.org" && p.get("action") === "wbgetentities")
      return json({
        entities: { Q89: { claims: { P18: [{ mainsnak: { datavalue: { value: "Red Apple.jpg" } } }] } } },
      });
    if (url.hostname === "commons.wikimedia.org" && p.get("list") === "search")
      return json({ query: { search: [{ title: "File:Apple video.webm" }, { title: "File:Apples.jpg" }] } });
    if (url.hostname === "commons.wikimedia.org" && p.get("prop") === "imageinfo") {
      const thumb = (n: string) =>
        opts.evilThumb ? `https://evil.example/${n}` : `https://upload.wikimedia.org/thumb/${encodeURIComponent(n)}`;
      const all = [
        {
          title: "File:Red Apple.jpg",
          imageinfo: [{ thumburl: thumb("a"), mime: "image/jpeg", extmetadata: meta("Ann") }],
        },
        {
          title: "File:Apples.jpg",
          imageinfo: [{ thumburl: thumb("b"), mime: "image/jpeg", extmetadata: meta("Bob") }],
        },
        { title: "File:Apple video.webm", imageinfo: [{ thumburl: thumb("c"), mime: "video/webm" }] },
      ];
      const want = (p.get("titles") ?? "").split("|");
      return json({ query: { pages: all.filter((x) => want.includes(x.title)) } });
    }
    if (url.hostname === "upload.wikimedia.org") return new Response(PNG, { headers: { "content-type": "image/png" } });
    return new Response("nope", { status: 404 });
  }) as typeof fetch;
  return { f, calls };
}

describe("ảnh gợi ý (Wikimedia)", () => {
  it("Wikidata P18 lên trước, rồi Commons; bỏ video; ghi công tác giả + giấy phép (bỏ HTML)", async () => {
    const { f } = fakeWikimedia();
    const r = await suggestImages("苹果", 8, f);
    expect(r.map((x) => x.title)).toEqual(["File:Red Apple.jpg", "File:Apples.jpg"]);
    expect(r[0]).toMatchObject({ credit: "Ann · CC BY-SA 4.0 · Wikimedia Commons" });
    expect(r.every((x) => isUploadUrl(x.thumb))).toBe(true);
  });
  it("không có chữ Hán → không gọi mạng; ảnh không nằm trên upload.wikimedia.org bị bỏ; lỗi mạng → rỗng", async () => {
    const a = fakeWikimedia();
    expect(await suggestImages("apple", 8, a.f)).toEqual([]);
    expect(a.calls).toEqual([]);
    expect(await suggestImages("苹果", 8, fakeWikimedia({ evilThumb: true }).f)).toEqual([]);
    const down = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    expect(await suggestImages("苹果", 8, down)).toEqual([]);
  });
  it("tải ảnh đã chọn: chỉ tên file hợp lệ, chỉ từ upload.wikimedia.org", async () => {
    const { f } = fakeWikimedia();
    const d = await downloadSuggestedImage("File:Red Apple.jpg", f);
    expect(d.bytes.equals(PNG)).toBe(true);
    expect(d.credit).toContain("Ann");
    await expect(downloadSuggestedImage("https://evil.example/x.png", f)).rejects.toBeInstanceOf(lib.LibraryError);
    await expect(downloadSuggestedImage("File:a|b.jpg", f)).rejects.toBeInstanceOf(lib.LibraryError);
    await expect(
      downloadSuggestedImage("File:Red Apple.jpg", fakeWikimedia({ evilThumb: true }).f),
    ).rejects.toBeInstanceOf(lib.LibraryError);
  });
});

describe("gợi ý từ khi đang gõ", () => {
  it("chữ Hán → từ bắt đầu bằng phần đã gõ, từ ngắn lên trước", () => {
    const c = findCandidates("学", 8);
    expect(c[0]?.hanzi).toBe("学");
    expect(c.length).toBeGreaterThan(1);
    expect(c.every((x) => x.hanzi.startsWith("学"))).toBe(true);
  });
});

describe("ghi công ảnh", () => {
  let ADMIN: string;
  let U: string;
  beforeAll(async () => {
    [ADMIN, U] = [await makeUser("limgadm"), await makeUser("limgu")];
  });
  afterAll(async () => {
    await db.delete(libraryWord);
    await db.delete(libraryImage);
    await cleanupUsers();
    await pool.end();
  });
  it("lưu kèm ảnh; người học thấy ghi công khi từ public; xoá / thay bằng ảnh tự tải → hết ghi công", async () => {
    const id = await lib.createWord(
      ADMIN,
      libWordInputSchema.parse({ hanzi: "苹果测", pinyin: "píngguǒ", meaningVi: "quả táo" }),
      true,
    );
    await lib.setWordImage(id, lib.parseLibImage(PNG), "Ann · CC BY-SA 4.0 · Wikimedia Commons");
    expect((await lib.getPublicWord(U, id)).imageCredit).toBe("Ann · CC BY-SA 4.0 · Wikimedia Commons");
    await lib.setWordImage(id, lib.parseLibImage(PNG));
    expect((await lib.getPublicWord(U, id)).imageCredit).toBe("");
    await lib.setWordImage(id, lib.parseLibImage(PNG), "X");
    await lib.setWordImage(id, null);
    expect(await lib.getPublicWord(U, id)).toMatchObject({ hasImage: false, imageCredit: "" });
  });
});
