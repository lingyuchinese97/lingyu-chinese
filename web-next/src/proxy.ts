import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { checkDocsAuth, DOCS_PATHS } from "@/server/docs-auth";

/**
 * - Tài liệu API (/api-docs, /api/openapi.json): cần tài khoản riêng (HTTP Basic, xem `server/docs-auth.ts`).
 * - Trang trong app: kiểm tra NHANH — chưa có cookie phiên → chuyển tới /login ngay, không render trang.
 *   Đây chỉ là lớp lạc quan (cookie có thể hết hạn / giả); session thật được kiểm tra ở layout `(app)` và trong mọi Server Action.
 */
export async function proxy(request: NextRequest) {
  if (DOCS_PATHS.includes(request.nextUrl.pathname)) {
    const r = await checkDocsAuth(request.headers.get("authorization"));
    if (r === "ok") return NextResponse.next();
    if (r === "disabled") return new NextResponse("Not Found", { status: 404 });
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="LingYu API docs", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/home") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/api-docs",
    "/api/openapi.json",
    "/home/:path*",
    "/vocabulary/:path*",
    "/sentences/:path*",
    "/grammar/:path*",
    "/radicals/:path*",
    "/listening/:path*",
    "/review/:path*",
    "/lessons/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
