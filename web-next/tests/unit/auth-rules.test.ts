import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/auth-rules";
import {
  loginErrorMessage,
  registerErrorMessage,
  LOGIN_FAILED,
  EMAIL_TAKEN,
  RATE_LIMITED,
  ACCOUNT_DISABLED,
  BAD_ORIGIN,
} from "@/lib/auth-errors";

const ok = { name: "Lan", email: "  Lan@Example.COM ", password: "matkhau123", confirm: "matkhau123" };
const firstError = (r: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  r.error?.issues[0];

describe("registerSchema", () => {
  it("chuẩn hoá email (trim + lowercase)", () => {
    const r = registerSchema.parse(ok);
    expect(r.email).toBe("lan@example.com");
  });
  it("mật khẩu tối thiểu 8 ký tự", () => {
    const r = registerSchema.safeParse({ ...ok, password: "1234567", confirm: "1234567" });
    expect(r.success).toBe(false);
    expect(firstError(r)?.path).toEqual(["password"]);
  });
  it("chặn mật khẩu toàn khoảng trắng hoặc có khoảng trắng đầu/cuối", () => {
    expect(registerSchema.safeParse({ ...ok, password: "         ", confirm: "         " }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: " matkhau123", confirm: " matkhau123" }).success).toBe(false);
  });
  it("mật khẩu xác nhận phải khớp", () => {
    const r = registerSchema.safeParse({ ...ok, confirm: "khac12345" });
    expect(firstError(r)).toMatchObject({ path: ["confirm"], message: "Mật khẩu xác nhận không khớp." });
  });
  it("bắt buộc nhập lại mật khẩu", () => {
    const r = registerSchema.safeParse({ ...ok, confirm: "" });
    expect(firstError(r)).toMatchObject({ path: ["confirm"], message: "Vui lòng nhập lại mật khẩu." });
  });
  it("email sai định dạng", () => {
    expect(registerSchema.safeParse({ ...ok, email: "abc" }).success).toBe(false);
  });
  it("tên không được trống", () => {
    expect(registerSchema.safeParse({ ...ok, name: "   " }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("yêu cầu email và mật khẩu", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("thông báo lỗi", () => {
  it("đăng nhập sai luôn là câu chung", () => {
    expect(loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(LOGIN_FAILED);
    expect(loginErrorMessage({ status: 400 })).toBe(LOGIN_FAILED);
    expect(loginErrorMessage({ status: 429 })).toBe(RATE_LIMITED);
    expect(loginErrorMessage({ status: 403 })).toBe(ACCOUNT_DISABLED);
  });
  it("email đã tồn tại", () => {
    expect(registerErrorMessage({ status: 422, code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe(EMAIL_TAKEN);
  });
  it("sai địa chỉ (origin) báo rõ thay vì lỗi chung", () => {
    expect(registerErrorMessage({ status: 403, code: "INVALID_ORIGIN" })).toBe(BAD_ORIGIN);
    expect(loginErrorMessage({ status: 403, code: "INVALID_ORIGIN" })).toBe(BAD_ORIGIN);
  });
});
