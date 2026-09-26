import "server-only";
import { z } from "zod";
import { AuthError, getSession, type SessionUser } from "@/server/session";
import { log } from "@/server/log";
import { getT } from "@/i18n/server";
import { VocabError } from "@/features/vocabulary/service";
import { ReviewError } from "@/features/review/service";
import { ListeningError } from "@/features/listening/service";
import { PronunciationError } from "@/features/pronunciation/service";

/**
 * Khung chung cho REST API `/api/v1/...` (quy ước ở CLAUDE.md):
 * - Bắt buộc đăng nhập (phiên Better Auth, cookie) → 401 nếu chưa.
 * - Thân request ghi (POST/PUT/PATCH/DELETE) phải là JSON (`Content-Type: application/json`) → 415 nếu không. Cùng cookie
 *   SameSite=Lax, điều này chặn trang web khác gửi form giả mạo.
 * - Trả `{ ok: true, data }` hoặc `{ ok: false, message, fieldErrors? }` với mã HTTP đúng; thông báo theo ngôn ngữ của người dùng.
 * - userId luôn lấy từ phiên, không bao giờ từ request.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Ctx<P> = { user: SessionUser; req: Request; params: P };
type Handler<P, T> = (ctx: Ctx<P>) => Promise<T | Response>;

const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function api<P = Record<string, never>, T = unknown>(fn: Handler<P, T>, opts: { status?: number } = {}) {
  return async (req: Request, ctx: { params: Promise<P> }): Promise<Response> => {
    const t = await getT();
    try {
      const s = await getSession();
      if (!s) throw new AuthError("unauthenticated");
      if (WRITE.has(req.method)) {
        const ct = req.headers.get("content-type") ?? "";
        const len = Number(req.headers.get("content-length") ?? 0);
        const hasBody = len > 0 || req.headers.has("transfer-encoding");
        if (hasBody && !ct.toLowerCase().startsWith("application/json"))
          return json({ ok: false, message: t("api.jsonOnly") }, 415);
      }
      const out = await fn({ user: s.user, req, params: (await ctx?.params) ?? ({} as P) });
      if (out instanceof Response) return out;
      return json({ ok: true, data: out ?? null }, opts.status ?? 200);
    } catch (e) {
      return errorResponse(e, t);
    }
  };
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Đọc JSON body (rỗng → {}), lỗi cú pháp → 400. */
export async function body(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "Dữ liệu không hợp lệ.");
  }
}

/** Tham số query → object (giá trị lặp lại lấy giá trị đầu). */
export function query(req: Request) {
  return Object.fromEntries(new URL(req.url).searchParams.entries());
}

function errorResponse(e: unknown, t: Awaited<ReturnType<typeof getT>>) {
  if (e instanceof AuthError)
    return json({ ok: false, message: t.maybe(e.message) }, e.code === "unauthenticated" ? 401 : 403);
  if (e instanceof ApiError) return json({ ok: false, message: t.maybe(e.message) }, e.status);
  if (e instanceof VocabError)
    return json({ ok: false, message: t.maybe(e.message) }, e.code === "not-found" ? 404 : 400);
  if (e instanceof ListeningError || e instanceof PronunciationError)
    return json({ ok: false, message: t.maybe(e.message) }, e.code === "not-found" ? 404 : 400);
  if (e instanceof ReviewError)
    return json(
      { ok: false, message: t.maybe(e.message) },
      e.code === "not-found" ? 404 : e.code === "empty" ? 409 : 400,
    );
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path.join(".") || "form")] ??= t.maybe(i.message);
    return json({ ok: false, message: t("errors.checkRequired"), fieldErrors }, 400);
  }
  log.error({ err: e instanceof Error ? e.message : String(e) }, "api failed");
  return json({ ok: false, message: t("common.genericError") }, 500);
}
