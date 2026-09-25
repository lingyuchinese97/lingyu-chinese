import { afterAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { pool } from "@/server/db/pool";

describe("/api/health", () => {
  afterAll(() => pool.end());
  it("trả 200 khi kết nối được Postgres", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", db: "ok" });
  });
});
