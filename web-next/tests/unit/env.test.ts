import { describe, expect, it } from "vitest";

describe("env", () => {
  it("đọc được biến môi trường bắt buộc và tách ADMIN_EMAILS", async () => {
    const { env } = await import("@/env");
    expect(env.DATABASE_URL).toMatch(/^postgres/);
    expect(Array.isArray(env.ADMIN_EMAILS)).toBe(true);
  });
});
