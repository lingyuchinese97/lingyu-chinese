import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { pool } from "@/server/db/pool";
import { user } from "@/server/db/schema";
import { findUserByEmail, resetUserPassword, setUserDisabled } from "@/server/users";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

function post(path: string, body: unknown, cookie?: string) {
  return auth.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE, ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
}
const signUp = (email: string, password = "matkhau123", name = "Người học") =>
  post("/sign-up/email", { name, email, password });
const signIn = (email: string, password = "matkhau123") => post("/sign-in/email", { email, password });

describe("luồng đăng ký / đăng nhập (Postgres thật)", () => {
  beforeEach(async () => {
    await db.delete(user).where(like(user.email, "%@test.lingyu"));
  });
  afterAll(async () => {
    await db.delete(user).where(like(user.email, "%@test.lingyu"));
    await pool.end();
  });

  it("đăng ký xong có cookie phiên (vào thẳng app), email được chuẩn hoá, role user", async () => {
    const res = await signUp("  Lan@Test.Lingyu ");
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("session_token");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    const u = await findUserByEmail("lan@test.lingyu");
    expect(u?.role).toBe("user");
  });

  it("hook sign-up từ chối mật khẩu < 8 ký tự bằng câu tiếng Việt", async () => {
    const res = await signUp("ngan@test.lingyu", "1234567");
    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/8 ký tự/);
  });

  it("không đăng ký trùng email", async () => {
    await signUp("trung@test.lingyu");
    const res = await signUp("TRUNG@test.lingyu");
    expect(res.status).toBe(422);
  });

  it("sai mật khẩu và email không tồn tại trả cùng một lỗi", async () => {
    await signUp("sai@test.lingyu");
    const a = await signIn("sai@test.lingyu", "khongdung1");
    const b = await signIn("khongco@test.lingyu", "khongdung1");
    expect((await signIn(" SAI@test.lingyu ")).status).toBe(200);
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect((await a.json()).code).toBe((await b.json()).code);
  });

  it("email trong ADMIN_EMAILS được gán role admin", async () => {
    await signUp("admin@test.lingyu");
    expect((await findUserByEmail("admin@test.lingyu"))?.role).toBe("admin");
  });

  it("tài khoản bị khoá không đăng nhập được, mở khoá thì được", async () => {
    await signUp("khoa@test.lingyu");
    const u = await findUserByEmail("khoa@test.lingyu");
    await setUserDisabled(u!.id, true);
    const res = await signIn("khoa@test.lingyu");
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie") ?? "").not.toContain("session_token=");
    await setUserDisabled(u!.id, false);
    expect((await signIn("khoa@test.lingyu")).status).toBe(200);
  });

  it("admin đặt lại mật khẩu: mật khẩu tạm dùng được, mật khẩu cũ hết tác dụng", async () => {
    await signUp("quen@test.lingyu");
    const u = await findUserByEmail("quen@test.lingyu");
    const temp = await resetUserPassword(u!.id);
    expect(temp).toHaveLength(12);
    expect((await signIn("quen@test.lingyu")).status).toBe(401);
    expect((await signIn("quen@test.lingyu", temp)).status).toBe(200);
    const row = await db.select().from(user).where(eq(user.email, "quen@test.lingyu"));
    expect(row).toHaveLength(1);
  });
});
