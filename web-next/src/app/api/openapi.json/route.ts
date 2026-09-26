/** Tài liệu OpenAPI — Swagger UI ở /api-docs đọc file này. Khoá bằng tài khoản riêng ở proxy (server/docs-auth.ts). */
import { openApiDocument } from "@/server/openapi";

// Không cache tĩnh ở CDN: mỗi request phải qua kiểm tra mật khẩu ở proxy.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(openApiDocument(), { headers: { "Cache-Control": "private, no-store" } });
}
