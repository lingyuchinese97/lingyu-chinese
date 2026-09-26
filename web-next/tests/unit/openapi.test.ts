import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openApiDocument } from "@/server/openapi";

const ROOT = path.resolve(__dirname, "../../src/app/api/v1");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

/** Mọi route.ts dưới /api/v1 → { "/api/v1/vocab/{id}": ["get", "put", "delete"] }. */
function routes(dir = ROOT, out: Record<string, string[]> = {}) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) routes(p, out);
    else if (name === "route.ts") {
      const url =
        "/api/v1/" +
        path
          .relative(ROOT, dir)
          .split(path.sep)
          .map((s) => s.replace(/^\[(\w+)\]$/, "{$1}"))
          .join("/");
      const src = readFileSync(p, "utf8");
      out[url] = METHODS.filter((m) => new RegExp(`export (const|async function|function) ${m}\\b`).test(src)).map(
        (m) => m.toLowerCase(),
      );
    }
  }
  return out;
}

describe("OpenAPI", () => {
  const doc = openApiDocument();

  it("là OpenAPI 3.1 và mô tả đủ mọi route /api/v1 (không thừa, không thiếu method)", () => {
    expect(doc.openapi).toBe("3.1.0");
    const paths = doc.paths as Record<string, Record<string, unknown>>;
    const documented = Object.fromEntries(
      Object.entries(paths)
        .filter(([k]) => k.startsWith("/api/v1/"))
        .map(([k, v]) => [k, Object.keys(v).sort()]),
    );
    const actual = Object.fromEntries(Object.entries(routes()).map(([k, v]) => [k, v.sort()]));
    expect(documented).toEqual(actual);
  });

  it("thân request lấy từ schema Zod (vd trường bắt buộc của từ vựng)", () => {
    const input = (doc.components.schemas as Record<string, { required?: string[] }>).VocabInput!;
    expect(input.required).toEqual(expect.arrayContaining(["hanzi", "pinyin", "meaningVi"]));
  });

  it("mọi $ref đều trỏ tới schema có thật", () => {
    const names = new Set(Object.keys(doc.components.schemas));
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"#\/components\/schemas\/(\w+)"/g)].map((m) => m[1]!);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) expect(names.has(r), r).toBe(true);
  });
});
