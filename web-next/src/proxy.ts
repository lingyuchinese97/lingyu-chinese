import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Kiểm tra NHANH: chưa có cookie phiên → chuyển tới /login ngay, không render trang.
 * Đây chỉ là lớp lạc quan (cookie có thể hết hạn / giả); session thật được kiểm tra ở layout `(app)` và trong mọi Server Action.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/home") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/home/:path*",
    "/vocabulary/:path*",
    "/grammar/:path*",
    "/radicals/:path*",
    "/review/:path*",
    "/lessons/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
