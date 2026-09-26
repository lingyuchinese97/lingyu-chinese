/** Tài liệu OpenAPI (công khai, không chứa dữ liệu người dùng) — Swagger UI ở /api-docs đọc file này. */
import { openApiDocument } from "@/server/openapi";

export const dynamic = "force-static";

export function GET() {
  return Response.json(openApiDocument());
}
