/** Ngôn ngữ giao diện của người đang đăng nhập. GET: xem · PUT { locale: "vi" | "en" }: đổi (lưu vào tài khoản + cookie). */
import { z } from "zod";
import { getSession } from "@/server/session";
import { setUserLocale } from "@/features/account/service";
import { env } from "@/env";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALES } from "@/i18n/config";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

const body = z.object({ locale: z.enum(LOCALES) });

export async function GET() {
  const s = await getSession();
  const t = await getT();
  if (!s) return Response.json({ ok: false, message: t("common.unauthenticated") }, { status: 401 });
  return Response.json({ ok: true, data: { locale: s.user.locale ?? DEFAULT_LOCALE } });
}

export async function PUT(req: Request) {
  const s = await getSession();
  const t = await getT();
  if (!s) return Response.json({ ok: false, message: t("common.unauthenticated") }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: t("common.invalidData") }, { status: 400 });
  await setUserLocale(s.user.id, parsed.data.locale);
  const secure = env.BETTER_AUTH_URL.startsWith("https://") ? "; Secure" : "";
  return Response.json(
    { ok: true, data: { locale: parsed.data.locale } },
    {
      headers: {
        "Set-Cookie": `${LOCALE_COOKIE}=${parsed.data.locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`,
        "Cache-Control": "no-store",
      },
    },
  );
}
