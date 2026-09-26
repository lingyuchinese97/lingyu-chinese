import { describe, expect, it } from "vitest";
import { checkDocsAuth } from "@/server/docs-auth";

const basic = (u: string, p: string) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
const cfg = { user: "docs", password: "mat-khau-rat-dai-123" };

describe("khoá tài liệu API bằng tài khoản riêng", () => {
  it("chưa cấu hình, hoặc mật khẩu quá ngắn → tắt (404)", async () => {
    expect(await checkDocsAuth(basic("docs", "x"), {})).toBe("disabled");
    expect(await checkDocsAuth(basic("docs", "short"), { user: "docs", password: "short" })).toBe("disabled");
  });

  it("đúng tên + mật khẩu → cho vào", async () => {
    expect(await checkDocsAuth(basic("docs", "mat-khau-rat-dai-123"), cfg)).toBe("ok");
    // Mật khẩu chứa dấu ":" và chữ có dấu vẫn đúng.
    expect(await checkDocsAuth(basic("tài", "a:b:c-mật-khẩu"), { user: "tài", password: "a:b:c-mật-khẩu" })).toBe("ok");
  });

  it("thiếu, sai định dạng, sai tên hoặc mật khẩu → 401", async () => {
    for (const h of [
      null,
      "",
      "Bearer abc",
      "Basic !!!",
      "Basic " + Buffer.from("khongcohaicham").toString("base64"),
      basic("docs", "mat-khau-sai-1234"),
      basic("admin", "mat-khau-rat-dai-123"),
      basic("docs", "mat-khau-rat-dai-12"),
    ])
      expect(await checkDocsAuth(h, cfg), String(h)).toBe("unauthorized");
  });
});
