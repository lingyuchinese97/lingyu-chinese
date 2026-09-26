import { describe, expect, it } from "vitest";
import { mandarinRank, pickMandarinVoice } from "@/lib/mandarin-voice";

const v = (lang: string, name = lang) => ({ lang, name });

describe("chọn giọng đọc tiếng Phổ thông", () => {
  it("không bao giờ chọn giọng Quảng Đông (zh-HK, yue…)", () => {
    for (const x of [
      v("zh-HK"),
      v("zh_HK"),
      v("yue-HK"),
      v("zh-MO"),
      v("zh-yue"),
      v("zh", "Google 粤語（香港）"),
      v("zh-CN", "Cantonese"),
    ])
      expect(mandarinRank(x), `${x.lang} ${x.name}`).toBeNull();
    expect(pickMandarinVoice([v("zh-HK"), v("yue-HK")])).toBeNull();
    expect(pickMandarinVoice([v("en-US"), v("vi-VN")])).toBeNull();
  });
  it("ưu tiên zh-CN, rồi cmn / zh-Hans, rồi zh-TW", () => {
    expect(pickMandarinVoice([v("zh-HK"), v("zh-TW"), v("zh_CN")])?.lang).toBe("zh_CN");
    expect(pickMandarinVoice([v("zh-TW"), v("cmn-Hans-SG")])?.lang).toBe("cmn-Hans-SG");
    expect(pickMandarinVoice([v("zh-HK"), v("zh-TW")])?.lang).toBe("zh-TW");
    expect(pickMandarinVoice([v("zh-HK"), v("zh")])?.lang).toBe("zh");
  });
});
